const int LED_BLUE = 23, LED_RED = 21;
unsigned long lastBlue = 0, lastRed = 0, lastPrint = 0;
bool blueOn = false, redOn = false;
void setup() { Serial.begin(115200);
  pinMode(LED_BLUE, OUTPUT); pinMode(LED_RED, OUTPUT); }
void loop() {
  unsigned long now = millis();
  if (now - lastBlue >= 300) {          // every 300 ms
    lastBlue = now;
    blueOn = !blueOn;
    digitalWrite(LED_BLUE, blueOn);
  }
  if (now - lastRed >= 1000) {          // every 1 s
    lastRed = now;
    redOn = !redOn;
    digitalWrite(LED_RED, redOn);
  }
  if (now - lastPrint >= 2000) {        // every 2 s
    lastPrint = now;
    Serial.printf("uptime: %lu s\n", now / 1000);
  }
}
