const int LED_PIN = 21;
const int DOT  = 200;                 // ms: one place to tune
const int DASH = 3 * DOT;
const char *pattern = "...---...";    // S O S

void setup() { pinMode(LED_PIN, OUTPUT); }

void loop() {
  for (int i = 0; i < strlen(pattern); i++) {
    int onTime = (pattern[i] == '.') ? DOT : DASH;
    digitalWrite(LED_PIN, HIGH);
    delay(onTime);
    digitalWrite(LED_PIN, LOW);
    delay(DOT);                       // gap between symbols
  }
  delay(7 * DOT);                     // gap between words
}
