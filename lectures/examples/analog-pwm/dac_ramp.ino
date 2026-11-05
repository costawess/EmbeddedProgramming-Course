// 8-bit DAC: GPIO25 (DAC1), GPIO26 (DAC2)
void setup() {}

void loop() {
  for (int v = 0; v < 256; v++) {
    dacWrite(25, v);      // 0..255 -> 0..3.3 V
    delayMicroseconds(100);
  }
}
