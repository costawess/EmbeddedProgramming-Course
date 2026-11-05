const uint8_t POT_PIN = 34;
const int MAX_SECONDS = 20;

int lastSentSeconds = -1;
unsigned long lastSampleMs = 0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  if (millis() - lastSampleMs < 120) return;
  lastSampleMs = millis();

  const int raw = analogRead(POT_PIN);
  const int seconds = map(raw, 0, 4095, 0, MAX_SECONDS);

  if (seconds != lastSentSeconds) {
    Serial.print("TIME:");
    Serial.println(seconds);
    lastSentSeconds = seconds;
  }
}
