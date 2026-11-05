const int LED_PIN = 2;      // on-board LED

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);                // waits: nothing else runs
  digitalWrite(LED_PIN, LOW);
  delay(500);
}
