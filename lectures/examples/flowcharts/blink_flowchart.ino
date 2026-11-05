const int LED_PIN = 23;      // blue LED

void setup() {
  pinMode(LED_PIN, OUTPUT);  // LED pin = output
}

void loop() {
  digitalWrite(LED_PIN, HIGH);   // LED on
  delay(500);                    // wait 500 ms
  digitalWrite(LED_PIN, LOW);    // LED off
  delay(500);                    // wait 500 ms
}
