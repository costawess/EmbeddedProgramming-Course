const int LEDS[] = {23, 22, 21, 4};
const int N = sizeof(LEDS) / sizeof(LEDS[0]);  // 4
void setup() {
  for (int i = 0; i < N; i++) {
    pinMode(LEDS[i], OUTPUT);
  }
}
void loop() {
  for (int i = 0; i < N; i++) {          // forward
    digitalWrite(LEDS[i], HIGH);
    delay(120);
    digitalWrite(LEDS[i], LOW);
  }
  for (int i = N - 2; i > 0; i--) {      // back
    digitalWrite(LEDS[i], HIGH);
    delay(120);
    digitalWrite(LEDS[i], LOW);
  }
}
