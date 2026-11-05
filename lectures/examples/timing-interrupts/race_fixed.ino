volatile uint32_t pulses = 0;
uint32_t lastPulses = 0;
void IRAM_ATTR onPulse() { pulses++; }

void loop() {
  delay(1000);
  uint32_t now = pulses;          // 1 read
  Serial.println(now - lastPulses);
  lastPulses = now;               // our copy
}
