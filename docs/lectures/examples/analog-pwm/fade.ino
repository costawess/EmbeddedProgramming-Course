const int LED_PIN  = 18;
const int FREQ_HZ  = 5000;
const int RES_BITS = 8;            // duty 0..255

void setup() {
  ledcAttach(LED_PIN, FREQ_HZ, RES_BITS);  // core 3.x
}

void loop() {
  for (int d = 0; d <= 255; d++) { ledcWrite(LED_PIN, d); delay(4); }
  for (int d = 255; d >= 0; d--) { ledcWrite(LED_PIN, d); delay(4); }
}
