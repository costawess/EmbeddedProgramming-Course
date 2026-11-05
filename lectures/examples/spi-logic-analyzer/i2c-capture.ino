#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin(19, 18); // course board: SDA, SCL
  Wire.setClock(100000);
}
void loop() {
  Wire.beginTransmission(0x76);
  Wire.write(0xD0);   // chip-ID register
  if (Wire.endTransmission(false) == 0) {
    if (Wire.requestFrom((uint8_t)0x76,
                         (size_t)1, true) == 1) {
      Serial.printf("ID: 0x%02X\n", Wire.read());
    }
  }
  delay(1000);
}
