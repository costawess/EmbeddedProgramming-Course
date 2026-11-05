"""BLE receiver: ACK only after durable local storage / platform acceptance."""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sqlite3
import time
import urllib.request
from pathlib import Path

SERVICE_UUID = "79210001-bca0-4f57-9230-41624b109410"
RX_UUID = "79210002-bca0-4f57-9230-41624b109410"
TX_UUID = "79210003-bca0-4f57-9230-41624b109410"
DATA_DIRECTORY = Path(__file__).resolve().parent / "data"


def validate_record(record: dict) -> None:
    required = ("id", "medication_id", "taken_at_epoch", "uptime_ms",
                "clock_synced_this_boot", "last_clock_sync_epoch", "sent_to_platform", "sent_at_epoch")
    if record.get("type") != "record" or any(key not in record for key in required):
        raise ValueError("Invalid medication record")
    identifier = record["id"]
    if not isinstance(identifier, str) or not identifier or len(identifier) > 64:
        raise ValueError("Invalid record ID")
    if not all(c in "0123456789abcdefABCDEF-" for c in identifier):
        raise ValueError("Unsafe record ID")


class Receiver:
    def __init__(self, database: Path, platform_url: str | None = None):
        database.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(database)
        self.connection.execute("PRAGMA synchronous=FULL")
        self.connection.execute("""CREATE TABLE IF NOT EXISTS medication (
            id TEXT PRIMARY KEY, payload TEXT NOT NULL,
            sent_to_platform INTEGER NOT NULL, sent_at_epoch INTEGER NOT NULL,
            destination TEXT NOT NULL)""")
        self.platform_url = platform_url

    def accept(self, record: dict) -> int:
        validate_record(record)
        destination = self.platform_url or "local-sqlite"
        existing = self.connection.execute(
            "SELECT payload, sent_at_epoch, destination FROM medication WHERE id = ?", (record["id"],)
        ).fetchone()
        if existing:
            immutable = ("id", "medication_id", "taken_at_epoch", "uptime_ms",
                         "clock_synced_this_boot", "last_clock_sync_epoch")
            old = json.loads(existing[0])
            if existing[2] != destination or any(old.get(k) != record.get(k) for k in immutable):
                raise ValueError("Record ID conflict / different platform; use another database")
            return existing[1]  # Retransmission: preserve original acceptance timestamp.
        accepted_at = int(time.time())
        if self.platform_url:
            headers = {"Content-Type": "application/json", "Idempotency-Key": record["id"]}
            token = os.environ.get("MEDICATION_PLATFORM_TOKEN")
            if token:
                headers["Authorization"] = f"Bearer {token}"
            request = urllib.request.Request(self.platform_url, data=json.dumps(record).encode(), headers=headers)
            with urllib.request.urlopen(request, timeout=20) as response:
                confirmation = json.loads(response.read(65536))
            if confirmation.get("accepted") is not True or confirmation.get("id") != record["id"]:
                raise ValueError("Platform did not confirm durable acceptance of this record")
            accepted_at = confirmation.get("accepted_at_epoch")
        if type(accepted_at) is not int or not 1704067200 <= accepted_at <= 4102444800:
            raise ValueError("Invalid acceptance timestamp")
        stored = dict(record, sent_to_platform=True, sent_at_epoch=accepted_at)
        # Context commits before returning; failures propagate and prevent BLE ACK.
        with self.connection:
            self.connection.execute("INSERT INTO medication VALUES (?, ?, 1, ?, ?)",
                                    (record["id"], json.dumps(stored), accepted_at, destination))
        return accepted_at

    def export(self, path: Path) -> None:
        records = [json.loads(row[0]) for row in self.connection.execute("SELECT payload FROM medication ORDER BY rowid")]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")

    def close(self) -> None:
        self.connection.close()


class LineDecoder:
    """Reassemble newline-delimited JSON over arbitrary BLE notification fragments."""
    def __init__(self):
        self.buffer = bytearray()

    def feed(self, data: bytes) -> list[dict]:
        self.buffer.extend(data)
        result = []
        while b"\n" in self.buffer:
            line, _, remainder = self.buffer.partition(b"\n")
            if len(line) > 2048:
                raise ValueError("BLE message too large")
            self.buffer = bytearray(remainder)
            result.append(json.loads(line))
        if len(self.buffer) > 2048:
            raise ValueError("BLE message too large")
        return result


async def synchronize(args) -> None:
    from bleak import BleakClient, BleakScanner

    if args.platform_url and not args.platform_url.startswith("https://"):
        raise ValueError("Use an HTTPS platform endpoint")
    receiver = Receiver(args.database, args.platform_url)
    try:
        if args.address:
            device = await BleakScanner.find_device_by_address(args.address, timeout=15)
        else:
            device = await BleakScanner.find_device_by_filter(
                lambda device, advertisement: SERVICE_UUID in [s.lower() for s in advertisement.service_uuids],
                timeout=15)
        if device is None:
            raise RuntimeError("Medication-XIAO not found")
        decoder = LineDecoder()
        messages: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def received(_characteristic, data):
            try:
                for message in decoder.feed(data):
                    loop.call_soon_threadsafe(messages.put_nowait, message)
            except Exception as error:
                loop.call_soon_threadsafe(messages.put_nowait, error)

        async with BleakClient(device, pair=True, timeout=60) as client:
            async def send(command: str):
                encoded = (command + "\n").encode("ascii")
                for offset in range(0, len(encoded), 20):
                    await client.write_gatt_char(RX_UUID, encoded[offset:offset + 20], response=True)

            await client.start_notify(TX_UUID, received)
            await send("REQUEST")
            while True:
                message = await asyncio.wait_for(messages.get(), timeout=40)
                if isinstance(message, Exception):
                    raise message
                if message.get("type") == "error":
                    raise RuntimeError(f"ESP32: {message.get('code')}")
                if message.get("type") == "done":
                    print(f"Report complete; {message['acknowledged']} records confirmed on the ESP32.")
                    break
                if message.get("type") != "record":
                    raise ValueError("Unexpected BLE message")
                # SD remains pending until this succeeds and the ACK is persisted there.
                accepted_at = receiver.accept(message)
                await send(f"ACK,{message['id']},{accepted_at}")
                print(f"Accepted {message['id']}")
            await client.stop_notify(TX_UUID)
        receiver.export(args.export)
        print(f"Report saved to {args.export}")
    finally:
        receiver.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", help="Optional BLE address of the XIAO")
    parser.add_argument("--database", type=Path, default=DATA_DIRECTORY / "medication.sqlite3")
    parser.add_argument("--export", type=Path, default=DATA_DIRECTORY / "medication_report.json")
    parser.add_argument("--platform-url", help="HTTPS endpoint implementing the contract in README.md")
    args = parser.parse_args()
    asyncio.run(synchronize(args))


if __name__ == "__main__":
    main()
