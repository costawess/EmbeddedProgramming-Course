// if: do something only when true
if (temperature > 30) {
  digitalWrite(LED_RED, HIGH);
}

// if / else: choose between two
if (temperature > 30) {
  digitalWrite(LED_RED, HIGH);
} else {
  digitalWrite(LED_RED, LOW);
}

// else if: choose between many
if (temperature > 30) {
  Serial.println("hot");
} else if (temperature > 20) {
  Serial.println("warm");
} else {
  Serial.println("cold");
}
