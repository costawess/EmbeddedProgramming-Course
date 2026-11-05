// nested loops: multiplication table
for (int row = 1; row <= 5; row++) {
  for (int col = 1; col <= 5; col++) {
    Serial.printf("%4d", row * col);
  }
  Serial.println();
}
