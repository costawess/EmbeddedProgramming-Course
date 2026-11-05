const int LDR_PIN = 39;      // AD2 terminal
const int DARK  = 300;       // raw value when covered
const int LIGHT = 3500;      // raw value under a lamp

void setup() { Serial.begin(115200); }

void loop() {
  int raw = analogRead(LDR_PIN);
  int percent = map(raw, DARK, LIGHT, 0, 100);
  percent = constrain(percent, 0, 100);
  Serial.printf("raw=%d  light=%d %%\n", raw, percent);
  delay(200);
}
