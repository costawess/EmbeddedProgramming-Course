const int POT_PIN = 36;            // AD1 terminal (wiper)
const float VREF = 3.3;            // full-scale voltage
const int ADC_MAX = 4095;          // 12-bit ADC
float toVolts(int raw) {
  return raw * VREF / ADC_MAX;     // float result
}
int toPercent(int raw) {
  return raw * 100L / ADC_MAX;     // 100L: no overflow
}
void setup() {
  Serial.begin(115200);
}
void loop() {
  int raw = analogRead(POT_PIN);
  float volts = toVolts(raw);
  int mv = analogReadMilliVolts(POT_PIN);  // calibrated
  Serial.printf("raw:%d,volts:%.2f,mV:%d,percent:%d\n",
                raw, volts, mv, toPercent(raw));
  delay(100);
}
