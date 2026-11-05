uint8_t readReg(uint8_t dev, uint8_t reg) {
  Wire.beginTransmission(dev);
  Wire.write(reg);
  Wire.endTransmission(false);   // repeated start
  Wire.requestFrom(dev, (uint8_t) 1);
  return Wire.read();
}
// MPU-6050: readReg(0x68, 0x75) == 0x68
