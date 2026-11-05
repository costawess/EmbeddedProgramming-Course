const int POT_PIN = 36;
float convertToVoltage(int adcValue) {
  return adcValue * 3.3 / 4095.0;    // 12-bit ADC
}
bool isAbove(float value, float limit) {
  return value > limit;
}
void setup() { Serial.begin(115200); }
void loop() {
  int raw = analogRead(POT_PIN);
  float voltage = convertToVoltage(raw);
  Serial.printf("raw=%d  V=%.2f\n", raw, voltage);
  if (isAbove(voltage, 2.0)) {
    Serial.println("Above 2 V!");
  }
  delay(500);
}
