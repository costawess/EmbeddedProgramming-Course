const int POT_PIN = 36;
const int LED_PIN = 22;          // green LED

void setup() {
  ledcAttach(LED_PIN, 5000, 12); // 5 kHz, 12 bit
}

void loop() {
  int raw = analogRead(POT_PIN); // 0..4095
  ledcWrite(LED_PIN, raw);       // duty 0..4095
  delay(10);
}
