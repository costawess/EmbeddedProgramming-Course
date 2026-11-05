const int KEY1 = 34;
const int LED_GREEN = 22;

bool ledOn = false;
bool lastKey = LOW;

void setup() {
  pinMode(KEY1, INPUT);
  pinMode(LED_GREEN, OUTPUT);
}

void loop() {
  bool key = digitalRead(KEY1);
  if (key == HIGH && lastKey == LOW) {  // rising edge
    ledOn = !ledOn;                     // toggle
    digitalWrite(LED_GREEN, ledOn);
  }
  lastKey = key;                        // remember
  delay(10);
}
