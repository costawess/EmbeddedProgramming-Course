const int LED_PIN = 2;
const unsigned long PERIOD_MS = 250;
unsigned long lastToggle = 0;
bool ledOn = false;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  unsigned long now = millis();
  if (now - lastToggle >= PERIOD_MS) {  // overflow-safe
    lastToggle = now;
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn);
  }
  // loop stays free for other work: echo serial input
  if (Serial.available()) Serial.write(Serial.read());
}
