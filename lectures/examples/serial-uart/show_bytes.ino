// Shows every byte you send from the
// Serial Monitor: try every line ending!
void setup() {
  Serial.begin(115200);
}
void loop() {
  while (Serial.available()) {
    int b = Serial.read();
    Serial.printf("%3d  0x%02X  %c\n",
                  b, b, b >= 32 ? b : '.');
  }
}
