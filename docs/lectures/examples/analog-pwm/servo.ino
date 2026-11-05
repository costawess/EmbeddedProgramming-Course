const int SERVO_PIN = 13;

void writeAngle(int deg) {
  int us = map(deg, 0, 180, 500, 2500);   // pulse width
  uint32_t duty = (uint32_t)us * 65535 / 20000;
  ledcWrite(SERVO_PIN, duty);
}

void setup() {
  ledcAttach(SERVO_PIN, 50, 16);  // 50 Hz = 20 ms, 16 bit
}

void loop() {
  writeAngle(0);   delay(1000);
  writeAngle(90);  delay(1000);
  writeAngle(180); delay(1000);
}
