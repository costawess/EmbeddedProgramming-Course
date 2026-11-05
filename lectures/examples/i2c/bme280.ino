#include <Wire.h>
#include <Adafruit_BME280.h>

Adafruit_BME280 bme;                 // uses Wire by default

void setup() {
  Serial.begin(115200);
  Wire.begin(19, 18);                // course board SDA, SCL
  if (!bme.begin(0x76)) {            // 0x77 if SDO is HIGH
    Serial.println("BME280 not found: check wiring/address");
    while (true) delay(10);
  }
}

void loop() {
  float t = bme.readTemperature();          // Celsius
  float h = bme.readHumidity();             // %
  float p = bme.readPressure() / 100.0F;    // Pa -> hPa
  Serial.printf("T=%.2f C  RH=%.1f %%  p=%.1f hPa\n", t, h, p);
  delay(2000);
}
