void setColor(bool r, bool g, bool b) {
  digitalWrite(Red, r);
  digitalWrite(Green, g);
  digitalWrite(Blue, b);
}

void loop() {
  int v = analogRead(36);
  if (v <= 1000)      setColor(HIGH, LOW, LOW);
  else if (v <= 2500) setColor(LOW, LOW, HIGH);
  else                setColor(LOW, HIGH, LOW);
}
