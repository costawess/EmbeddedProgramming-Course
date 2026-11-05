const int POT_PIN = 36;     // pot simulates 0..30 C
const int HEATER  = 21;     // red LED = heater
const float T_ON  = 19.0;   // switch on below
const float T_OFF = 21.0;   // switch off above
bool heaterOn = false;
float readTemperature() {
  return analogRead(POT_PIN) * 30.0 / 4095.0;
}
void setup() {
  Serial.begin(115200);
  pinMode(HEATER, OUTPUT);
}
void loop() {
  float t = readTemperature();
  if (!heaterOn && t < T_ON) {
    heaterOn = true;
  } else if (heaterOn && t > T_OFF) {
    heaterOn = false;
  }
  digitalWrite(HEATER, heaterOn);
  Serial.printf("T=%.1f heater=%d\n", t, heaterOn);
  delay(500);
}
