void blinkTimes(int pin, int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(ms);
    digitalWrite(pin, LOW);
    delay(ms);
  }
}

void setup() {
  pinMode(23, OUTPUT);
  pinMode(21, OUTPUT);
}

void loop() {
  blinkTimes(23, 3, 200);   // blue: 3 fast blinks
  blinkTimes(21, 1, 1000);  // red: 1 slow blink
}
