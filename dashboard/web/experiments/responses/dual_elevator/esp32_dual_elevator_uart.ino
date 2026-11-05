// Dual Elevator UART example for ESP32.
// Connect push buttons between GPIO18 / GPIO19 and GND.
// GPIO18 calls F1 up; GPIO19 calls F4 down.
// Browser owns animation, queues, capacity and door timing.
// This sketch selects F4 for passengers boarding at F1, otherwise F1.
#include <Arduino.h>

const uint8_t BUTTON_PINS[] = {18, 19};
bool lastRaw[] = {HIGH, HIGH};
bool stable[] = {HIGH, HIGH};
unsigned long changedAt[] = {0, 0};
String incoming;

void handleLine(const String &line) {
  if (!line.startsWith("BOARDED:")) return;
  // BOARDED:A:personId:floor (or B).
  int lastColon = line.lastIndexOf(':');
  int floor = line.substring(lastColon + 1).toInt();
  if (floor < 1 || floor > 4) return;
  char lift = line.charAt(8);
  if (lift != 'A' && lift != 'B') return;
  Serial.print("DEST:");
  Serial.print(lift);
  Serial.print(":");
  Serial.println(floor == 1 ? 4 : 1);
}

void setup() {
  Serial.begin(115200);
  for (uint8_t pin : BUTTON_PINS) pinMode(pin, INPUT_PULLUP);
  incoming.reserve(128);
}

void loop() {
  unsigned long now = millis();
  for (int index = 0; index < 2; index++) {
    bool raw = digitalRead(BUTTON_PINS[index]);
    if (raw != lastRaw[index]) {
      lastRaw[index] = raw;
      changedAt[index] = now;
    }
    if (now - changedAt[index] >= 35 && raw != stable[index]) {
      stable[index] = raw;
      if (raw == LOW) Serial.println(index == 0 ? "CALL:1:UP" : "CALL:4:DOWN");
    }
  }
  while (Serial.available()) {
    char value = Serial.read();
    if (value == '\n') {
      incoming.trim();
      handleLine(incoming);
      incoming = "";
    } else if (value != '\r') {
      if (incoming.length() < 128) incoming += value;
      else incoming = "";
    }
  }
}
