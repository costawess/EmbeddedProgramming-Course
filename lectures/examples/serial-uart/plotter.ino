const int POT = 36;

void setup() { Serial.begin(115200); }

void loop() {
  int raw = analogRead(POT);
  float volts = raw * 3.3 / 4095.0;
  int percent = map(raw, 0, 4095, 0, 100);

  // label:value pairs, comma separated
  Serial.printf("raw:%d,percent:%d,mV:%d\n",
                raw, percent, (int)(volts * 1000));
  delay(50);
}
