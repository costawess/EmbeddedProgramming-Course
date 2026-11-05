// blink 5 times
for (int i = 0; i < 5; i++) {
  digitalWrite(23, HIGH); delay(100);
  digitalWrite(23, LOW);  delay(100);
}

// count down 10, 9, ... 1
for (int i = 10; i > 0; i--) {
  Serial.println(i);
}

// even numbers 0, 2, ... 20
for (int i = 0; i <= 20; i += 2) {
  Serial.println(i);
}
