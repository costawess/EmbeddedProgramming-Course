volatile uint32_t pulses = 0;
void IRAM_ATTR onPulse() { pulses++; }

void loop() {
  delay(1000);
  Serial.println(pulses);  // ISR may fire...
  pulses = 0;              // ...here: lost!
}
