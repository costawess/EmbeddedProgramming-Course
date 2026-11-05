const int LEDS[] = {23, 22, 21, 4};
void turnOnAllLeds() {
  digitalWrite(23, HIGH);
  digitalWrite(22, HIGH);
  digitalWrite(21, HIGH);
  digitalWrite(4, HIGH);
}
void turnOffAllLeds() {
  digitalWrite(23, LOW);
  digitalWrite(22, LOW);
  digitalWrite(21, LOW);
  digitalWrite(4, LOW);
}
void setup() {
  for (int pin : LEDS) pinMode(pin, OUTPUT);
}
void loop() {
  turnOnAllLeds();
  delay(500);
  turnOffAllLeds();
  delay(500);
}
