import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sync_client import LineDecoder, Receiver


def record():
    return {"type": "record", "id": "AABBCCDDEEFF-00000001-00000001", "medication_id": "medication",
            "taken_at_epoch": 1791450000, "uptime_ms": 1234, "clock_synced_this_boot": True,
            "last_clock_sync_epoch": 1791449900, "sent_to_platform": False, "sent_at_epoch": None,
            "ack_received_at_epoch": None}


class ReceiverTests(unittest.TestCase):
    def test_fragmented_report_and_multiple_lines(self):
        data = (json.dumps(record()) + '\n{"type":"done","acknowledged":1}\n').encode()
        for fragment_size in (1, 7, 20, 128):
            decoder = LineDecoder()
            decoded = []
            for offset in range(0, len(data), fragment_size):
                decoded.extend(decoder.feed(data[offset:offset + fragment_size]))
            self.assertEqual(decoded, [record(), {"type": "done", "acknowledged": 1}])

    def test_commit_duplicate_and_restart_preserve_timestamp(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "medication.sqlite3"
            receiver = Receiver(path)
            with patch("sync_client.time.time", return_value=1791450050):
                timestamp = receiver.accept(record())
            receiver.close()
            receiver = Receiver(path)
            with patch("sync_client.time.time", return_value=1791451000):
                self.assertEqual(receiver.accept(record()), timestamp)
            exported = Path(directory) / "report.json"
            receiver.export(exported)
            rows = json.loads(exported.read_text())
            self.assertEqual(len(rows), 1)
            self.assertTrue(rows[0]["sent_to_platform"])
            self.assertEqual(rows[0]["sent_at_epoch"], timestamp)
            conflicting = dict(record(), taken_at_epoch=1791500000)
            with self.assertRaises(ValueError):
                receiver.accept(conflicting)
            receiver.close()

    def test_failed_platform_does_not_accept(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver = Receiver(Path(directory) / "records.sqlite3", "https://example.test/medication")
            with patch("sync_client.urllib.request.urlopen", side_effect=OSError("offline")):
                with self.assertRaises(OSError):
                    receiver.accept(record())
            self.assertEqual(receiver.connection.execute("SELECT count(*) FROM medication").fetchone()[0], 0)
            receiver.close()

    def test_platform_confirmation_timestamp_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver = Receiver(Path(directory) / "records.sqlite3", "https://example.test/medication")
            from unittest.mock import MagicMock
            response = MagicMock()
            response.__enter__.return_value.read.return_value = json.dumps(
                {"accepted": True, "id": record()["id"], "accepted_at_epoch": 1791450050}).encode()
            with patch("sync_client.urllib.request.urlopen", return_value=response) as post:
                self.assertEqual(receiver.accept(record()), 1791450050)
                self.assertEqual(receiver.accept(record()), 1791450050)
                self.assertEqual(post.call_count, 1)
                self.assertEqual(post.call_args.args[0].get_header("Idempotency-key"), record()["id"])
            receiver.close()

    def test_unconfirmed_platform_response_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver = Receiver(Path(directory) / "records.sqlite3", "https://example.test/medication")
            from unittest.mock import MagicMock
            response = MagicMock()
            response.__enter__.return_value.read.return_value = b'{"accepted":false}'
            with patch("sync_client.urllib.request.urlopen", return_value=response):
                with self.assertRaises(ValueError):
                    receiver.accept(record())
            self.assertEqual(receiver.connection.execute("SELECT count(*) FROM medication").fetchone()[0], 0)
            receiver.close()

    def test_unsynchronized_event_preserves_unknown_time(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver = Receiver(Path(directory) / "records.sqlite3")
            event = dict(record(), taken_at_epoch=None, clock_synced_this_boot=False, last_clock_sync_epoch=None)
            receiver.accept(event)
            saved = json.loads(receiver.connection.execute("SELECT payload FROM medication").fetchone()[0])
            self.assertIsNone(saved["taken_at_epoch"])
            receiver.close()

    def test_oversized_frame_rejected(self):
        with self.assertRaises(ValueError):
            LineDecoder().feed(b"x" * 2049)


if __name__ == "__main__":
    unittest.main()
