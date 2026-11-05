// keep reading until the pot is high
int value = analogRead(36);
while (value < 3000) {
  value = analogRead(36);
  delay(10);
}
Serial.println("Threshold reached");

// wait until KEY1 is pressed
while (digitalRead(34) == LOW) {
  // do nothing: just wait
}

// do-while: body runs at least once
int tries = 0;
do {
  tries++;
} while (tries < 3);
