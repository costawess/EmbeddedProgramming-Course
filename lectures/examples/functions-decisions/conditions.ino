// inside a range: AND
if (temperature > 20 && temperature < 30) {
  Serial.println("comfortable");
}

// outside a range: OR
if (temperature < 10 || temperature > 30) {
  digitalWrite(LED_RED, HIGH);      // alarm
}

// buttons: both, either, exactly one
bool k1 = digitalRead(34);
bool k2 = digitalRead(35);
if (k1 && k2)  Serial.println("both");
if (k1 || k2)  Serial.println("at least one");
if (k1 != k2)  Serial.println("exactly one");
if (!k1)       Serial.println("KEY1 released");
