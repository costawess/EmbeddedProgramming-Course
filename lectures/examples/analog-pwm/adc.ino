const int POT_PIN = 36;    // AD1 terminal: ADC1, OK with Wi-Fi

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);         // 0..4095 (default)
  analogSetAttenuation(ADC_11db);   // range ~0..3.1 V
}

void loop() {
  int raw = analogRead(POT_PIN);
  int mv  = analogReadMilliVolts(POT_PIN); // calibrated
  Serial.printf("raw=%4d  voltage=%4d mV\n", raw, mv);
  delay(200);
}
