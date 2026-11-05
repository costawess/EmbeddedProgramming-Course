#include "config.h"
#include <WiFi.h>
#include <SPI.h>
#include <SD.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <BLESecurity.h>
#include <esp_sntp.h>
#include <esp_timer.h>
#include <atomic>
#include <time.h>

// BLE callbacks only enqueue commands; all SD access happens in loop().
struct Command { uint32_t session; char text[128]; };
struct Record {
  String id, medication;
  uint64_t epoch = 0, uptime = 0, lastSync = 0;
  bool clockValid = false;
};
QueueHandle_t commands;
std::atomic<bool> connected(false), authenticated(false);
std::atomic<uint32_t> connectionSession(0), ntpEpoch(0);
BLECharacteristic *tx;
File reportDirectory;
String deviceId, outbound, inFlightId;
size_t outboundOffset = 0;
uint32_t bootNumber = 0, recordSequence = 0, reportCount = 0;
uint64_t nextClockAttempt = 0, clockAttemptStarted = 0, lastClockSync = 0;
uint64_t ackStarted = 0, nextChunk = 0, savedUntil = 0, errorUntil = 0;
bool sdReady = false, identityReady = false, clockValid = false;
bool clockAttempt = false, ntpStarted = false, reporting = false, awaitingAck = false;
bool lastButtonRaw = HIGH, stableButton = HIGH;
uint64_t buttonChanged = 0;
uint32_t handledSession = 0;

uint64_t uptimeMs() { return esp_timer_get_time() / 1000ULL; }
String number(uint64_t value) {
  char buffer[24]; snprintf(buffer, sizeof(buffer), "%llu", (unsigned long long)value);
  return String(buffer);
}
uint64_t epochNow() { return clockValid ? (uint64_t)time(nullptr) : 0; }
bool parseNumber(const String &value, uint64_t &out) {
  if (!value.length() || value.length() > 18) return false;
  out = 0;
  for (size_t i = 0; i < value.length(); ++i) {
    if (value[i] < '0' || value[i] > '9') return false;
    out = out * 10 + value[i] - '0';
  }
  return true;
}
String field(const String &line, int index) {
  int start = 0;
  while (index-- > 0) {
    start = line.indexOf(',', start);
    if (start < 0) return "";
    ++start;
  }
  int end = line.indexOf(',', start);
  return end < 0 ? line.substring(start) : line.substring(start, end);
}
uint32_t checksum(const String &text) {
  uint32_t hash = 2166136261UL;
  for (size_t i = 0; i < text.length(); ++i) { hash ^= (uint8_t)text[i]; hash *= 16777619UL; }
  return hash;
}
void storageError() {
  errorUntil = uptimeMs() + 5000;
  Serial.println("SD write/read failed; record NOT confirmed saved.");
}
bool readChecked(const String &path, String &payload) {
  File file = SD.open(path, FILE_READ);
  if (!file) return false;
  payload = file.readStringUntil('\n');
  String check = file.readStringUntil('\n');
  bool cleanEnd = file.available() == 0;
  file.close();
  uint64_t stored = 0;
  return cleanEnd && parseNumber(check, stored) && stored == checksum(payload);
}
bool writeChecked(const String &path, const String &payload) {
  // A incomplete .tmp never counts as a saved record or acknowledgement.
  String temporary = path + ".tmp";
  SD.remove(temporary);
  File file = SD.open(temporary, FILE_WRITE);
  if (!file) return false;
  String contents = payload + "\n" + number(checksum(payload)) + "\n";
  bool written = file.print(contents) == contents.length();
  file.flush(); file.close();
  String checked;
  if (!written || !readChecked(temporary, checked) || checked != payload || SD.exists(path)) return false;
  return SD.rename(temporary, path);
}
bool readRecord(const String &path, Record &record) {
  String line;
  if (!readChecked(path, line) || field(line, 0) != "1") return false;
  record.id = field(line, 1); record.medication = field(line, 2);
  record.clockValid = field(line, 5) == "1";
  return record.id.length() && record.medication.length() &&
    parseNumber(field(line, 3), record.epoch) && parseNumber(field(line, 4), record.uptime) &&
    parseNumber(field(line, 6), record.lastSync);
}
bool readAck(const String &id, uint64_t &platformEpoch, uint64_t &deviceEpoch) {
  String line;
  return readChecked("/medication/" + id + ".ack", line) && field(line, 0) == "1" &&
    field(line, 1) == id && parseNumber(field(line, 2), platformEpoch) && platformEpoch >= 1704067200ULL &&
    parseNumber(field(line, 3), deviceEpoch);
}
String recordJson(const Record &record) {
  uint64_t platformEpoch = 0, deviceEpoch = 0;
  bool sent = readAck(record.id, platformEpoch, deviceEpoch);
  return "{\"type\":\"record\",\"id\":\"" + record.id + "\",\"medication_id\":\"" + record.medication +
    "\",\"taken_at_epoch\":" + (record.clockValid ? number(record.epoch) : String("null")) +
    ",\"uptime_ms\":" + number(record.uptime) + ",\"clock_synced_this_boot\":" + (record.clockValid ? "true" : "false") +
    ",\"last_clock_sync_epoch\":" + (record.lastSync ? number(record.lastSync) : String("null")) +
    ",\"sent_to_platform\":" + (sent ? "true" : "false") +
    ",\"sent_at_epoch\":" + (sent ? number(platformEpoch) : String("null")) +
    ",\"ack_received_at_epoch\":" + (sent && deviceEpoch ? number(deviceEpoch) : String("null")) + "}";
}
void saveMedication() {
  if (!sdReady || !identityReady) { storageError(); return; }
  char suffix[24]; snprintf(suffix, sizeof(suffix), "-%08lx-%08lx", (unsigned long)bootNumber, (unsigned long)++recordSequence);
  String id = deviceId + suffix;
  String payload = "1," + id + "," + MEDICATION_ID + "," + number(epochNow()) + "," + number(uptimeMs()) +
    "," + (clockValid ? "1" : "0") + "," + number(lastClockSync);
  if (!writeChecked("/medication/" + id + ".rec", payload)) { storageError(); return; }
  savedUntil = uptimeMs() + 700;
  Serial.println("Saved " + id);
}
void stopReport() {
  reportDirectory.close();
  reporting = false; awaitingAck = false; inFlightId = ""; outbound = ""; outboundOffset = 0;
}
void queueReply(const String &message) { outbound = message + "\n"; outboundOffset = 0; nextChunk = 0; }
void nextRecord() {
  while (reportDirectory) {
    File file = reportDirectory.openNextFile();
    if (!file) break;
    String path = file.path(); bool directory = file.isDirectory(); file.close();
    if (directory || !path.endsWith(".rec")) continue;
    Record record;
    if (!readRecord(path, record)) { stopReport(); queueReply("{\"type\":\"error\",\"code\":\"corrupt_record\"}"); return; }
    uint64_t platformEpoch, deviceEpoch;
    if (readAck(record.id, platformEpoch, deviceEpoch)) continue;
    inFlightId = record.id;
    queueReply(recordJson(record));
    return;
  }
  reportDirectory.close(); reporting = false;
  queueReply("{\"type\":\"done\",\"acknowledged\":" + String(reportCount) + "}");
}
void handleCommand(const String &command) {
  if (command == "REQUEST") {
    stopReport(); reportCount = 0;
    if (!sdReady) { queueReply("{\"type\":\"error\",\"code\":\"sd_unavailable\"}"); return; }
    reportDirectory = SD.open("/medication");
    if (!reportDirectory) { queueReply("{\"type\":\"error\",\"code\":\"sd_unavailable\"}"); return; }
    reporting = true; nextRecord(); return;
  }
  if (!command.startsWith("ACK,")) return;
  String id = field(command, 1); uint64_t timestamp = 0;
  if (!reporting || !awaitingAck || id != inFlightId || !parseNumber(field(command, 2), timestamp) ||
      timestamp < 1704067200ULL || timestamp > 4102444800ULL) return;
  // ACK must be sent only AFTER durable acceptance by the receiving platform.
  String payload = "1," + id + "," + number(timestamp) + "," + number(epochNow());
  String ackPath = "/medication/" + id + ".ack";
  // Recover a truncated acknowledgement rather than treating existence as success.
  uint64_t existingPlatform, existingDevice;
  if (SD.exists(ackPath) && !readAck(id, existingPlatform, existingDevice)) SD.remove(ackPath);
  if (!readAck(id, existingPlatform, existingDevice) && !writeChecked(ackPath, payload)) {
    storageError(); stopReport(); queueReply("{\"type\":\"error\",\"code\":\"ack_save_failed\"}"); return;
  }
  ++reportCount; awaitingAck = false; inFlightId = ""; nextRecord();
}
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *) override {
    authenticated = false; ++connectionSession; connected = true;
  }
  void onDisconnect(BLEServer *) override {
    connected = false; authenticated = false; ++connectionSession;
  }
};
class SecurityCallbacks : public BLESecurityCallbacks {
#if defined(CONFIG_BLUEDROID_ENABLED)
  void onAuthenticationComplete(esp_ble_auth_cmpl_t result) override {
    authenticated = result.success && (result.auth_mode & ESP_LE_AUTH_REQ_MITM);
  }
#else
  void onAuthenticationComplete(ble_gap_conn_desc *result) override {
    authenticated = result->sec_state.encrypted && result->sec_state.authenticated;
  }
#endif
  bool onSecurityRequest() override { return true; }
};
class RxCallbacks : public BLECharacteristicCallbacks {
  String buffer; bool overflow = false; uint32_t session = 0;
  void onWrite(BLECharacteristic *characteristic) override {
    uint32_t current = connectionSession.load();
    if (current != session) { buffer = ""; overflow = false; session = current; }
    if (!authenticated) return;
    String value = characteristic->getValue();
    for (size_t i = 0; i < value.length(); ++i) {
      char c = value[i];
      if (c == '\n') {
        if (!overflow && buffer.length()) {
          Command command{}; command.session = current; buffer.toCharArray(command.text, sizeof(command.text));
          xQueueSend(commands, &command, 0);
        }
        buffer = ""; overflow = false;
      } else if (c != '\r') {
        if (buffer.length() < 127) buffer += c;
        else overflow = true;
      }
    }
  }
};
void setupBle() {
  commands = xQueueCreate(8, sizeof(Command));
  if (!commands) { Serial.println("Cannot allocate BLE command queue"); return; }
  BLEDevice::init(BLE_NAME);
#if defined(CONFIG_BLUEDROID_ENABLED)
  BLESecurity::setEncryptionLevel(ESP_BLE_SEC_ENCRYPT_MITM);
#endif
  BLEDevice::setSecurityCallbacks(new SecurityCallbacks());
  BLESecurity::setAuthenticationMode(ESP_LE_AUTH_REQ_SC_MITM_BOND);
  BLESecurity::setCapability(ESP_IO_CAP_OUT);
  BLESecurity::setPassKey(true, BLE_PAIRING_PIN);
  BLEServer *server = BLEDevice::createServer(); server->setCallbacks(new ServerCallbacks());
  BLEService *service = server->createService(SERVICE_UUID);
  BLECharacteristic *rx = service->createCharacteristic(RX_UUID, BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_WRITE_ENC | BLECharacteristic::PROPERTY_WRITE_AUTHEN);
#if defined(CONFIG_BLUEDROID_ENABLED)
  rx->setAccessPermissions(ESP_GATT_PERM_WRITE_ENC_MITM);
#endif
  rx->setCallbacks(new RxCallbacks());
  tx = service->createCharacteristic(TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  tx->addDescriptor(new BLE2902());
  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID); advertising->setScanResponse(true); advertising->start();
}
void serviceBle(uint64_t now) {
  uint32_t session = connectionSession.load();
  if (session != handledSession) {
    handledSession = session; stopReport();
    if (!connected) BLEDevice::startAdvertising();
  }
  if (!connected || !authenticated || !commands) return;
  Command command;
  while (xQueueReceive(commands, &command, 0) == pdTRUE) {
    if (command.session == session) handleCommand(String(command.text));
  }
  if (awaitingAck && now - ackStarted >= ACK_TIMEOUT_MS) {
    stopReport(); queueReply("{\"type\":\"error\",\"code\":\"ack_timeout\"}");
  }
  // Conservative 20-byte fragments also work with the minimum ATT MTU.
  if (outbound.length() && now >= nextChunk) {
    size_t size = min((size_t)20, outbound.length() - outboundOffset);
    tx->setValue((uint8_t *)outbound.c_str() + outboundOffset, size); tx->notify();
    outboundOffset += size; nextChunk = now + 20;
    if (outboundOffset == outbound.length()) {
      outbound = ""; outboundOffset = 0;
      if (inFlightId.length()) { awaitingAck = true; ackStarted = now; }
    }
  }
}
void serviceClock(uint64_t now) {
  uint32_t synced = ntpEpoch.exchange(0);
  if (synced >= 1704067200UL) {
    clockValid = true; lastClockSync = synced;
    clockAttempt = false; ntpStarted = false;
    nextClockAttempt = now + CLOCK_SYNC_MS;
    WiFi.disconnect(true); WiFi.mode(WIFI_OFF);
    Serial.println("Clock synchronized (UTC)");
  }
  if (!strlen(WIFI_SSID)) return;
  if (!clockAttempt && now >= nextClockAttempt) {
    clockAttempt = true; ntpStarted = false; clockAttemptStarted = now;
    WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
  if (clockAttempt && WiFi.status() == WL_CONNECTED && !ntpStarted) {
    esp_sntp_stop();
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    esp_sntp_set_sync_interval(CLOCK_SYNC_MS);
    ntpStarted = true;
  }
  if (clockAttempt && now - clockAttemptStarted >= WIFI_TIMEOUT_MS) {
    clockAttempt = false; ntpStarted = false; nextClockAttempt = now + WIFI_RETRY_MS;
    WiFi.disconnect(true); WiFi.mode(WIFI_OFF);
    Serial.println("Clock sync unavailable; retry in one minute");
  }
}
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP); pinMode(SAVED_LED_PIN, OUTPUT); pinMode(STATUS_LED_PIN, OUTPUT);
  lastButtonRaw = stableButton = digitalRead(BUTTON_PIN);
  Preferences preferences;
  if (preferences.begin("med-log", false)) {
    bootNumber = preferences.getUInt("boot", 0) + 1;
    identityReady = bootNumber != 0 && preferences.putUInt("boot", bootNumber) == sizeof(uint32_t);
    preferences.end();
  }
  uint64_t mac = ESP.getEfuseMac(); char id[16];
  snprintf(id, sizeof(id), "%012llX", (unsigned long long)(mac & 0xffffffffffffULL)); deviceId = id;
  bool safeMedicationId = strlen(MEDICATION_ID) > 0;
  for (const char *c = MEDICATION_ID; *c; ++c) if (!isalnum(*c) && *c != '-' && *c != '_') safeMedicationId = false;
  if (!safeMedicationId) identityReady = false;
  SPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  sdReady = SD.begin(SD_CS_PIN, SPI, SD_SPI_HZ) && (SD.exists("/medication") || SD.mkdir("/medication"));
  esp_sntp_set_time_sync_notification_cb([](struct timeval *time) { ntpEpoch = (uint32_t)time->tv_sec; });
  setupBle();
  Serial.printf("Medication logger: SD=%s, identity=%s\n", sdReady ? "ready" : "failed", identityReady ? "ready" : "failed");
}
void loop() {
  uint64_t now = uptimeMs();
  serviceClock(now);
  bool raw = digitalRead(BUTTON_PIN);
  if (raw != lastButtonRaw) { lastButtonRaw = raw; buttonChanged = now; }
  if (now - buttonChanged >= DEBOUNCE_MS && raw != stableButton) {
    stableButton = raw;
    if (raw == LOW) saveMedication();
  }
  serviceBle(now);
  digitalWrite(SAVED_LED_PIN, now < savedUntil);
  bool fault = !sdReady || !identityReady || now < errorUntil;
  digitalWrite(STATUS_LED_PIN, fault ? (now / 150) % 2 : connected ? HIGH : !clockValid ? (now / 1000) % 2 : LOW);
  delay(2);
}
