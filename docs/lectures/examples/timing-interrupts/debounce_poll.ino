const int KEY1 = 34;
int stable = LOW, lastRead = LOW;
unsigned long lastChange = 0;
void loop() {
  int r = digitalRead(KEY1);
  if (r != lastRead) {             // moved
    lastChange = millis();
    lastRead = r;
  }
  if (millis() - lastChange > 30 && r != stable) {
    stable = r;                    // accepted
    if (stable == HIGH) Serial.println("press");
  }
}
