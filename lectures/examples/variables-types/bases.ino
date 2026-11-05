void setup() {
  Serial.begin(115200);
  int x = 200;
  Serial.println(x, BIN);   // 11001000
  Serial.println(x, HEX);   // C8
  Serial.println(x, DEC);   // 200
  Serial.printf("0x%02X\n", x);  // 0xC8
}
void loop() {}
