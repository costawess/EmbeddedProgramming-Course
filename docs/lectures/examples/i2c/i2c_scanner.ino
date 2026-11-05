#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(19, 18);      // course board SDA, SCL
  Wire.setClock(400000);   // fast mode
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0)
      Serial.printf("Found 0x%02X\n", a);
  }
}

void loop() {}
