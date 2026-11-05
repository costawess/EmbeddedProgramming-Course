#include <Wire.h>
#include <Adafruit_BME280.h>
Adafruit_BME280 bme;
struct Measurement {
  float temperature;     // C
  float humidity;        // %
  float pressure;        // hPa
  unsigned long time;    // ms since start
};
Measurement measure() {                 // returns all values at once
  Measurement m;
  m.temperature = bme.readTemperature();
  m.humidity    = bme.readHumidity();
  m.pressure    = bme.readPressure() / 100.0F;
  m.time        = millis();
  return m;
}
void print(const Measurement &m) {
  Serial.printf("t=%lus  T=%.1f C  RH=%.0f %%  p=%.1f hPa\n",
                m.time / 1000, m.temperature, m.humidity, m.pressure);
}
void setup() { Serial.begin(115200); Wire.begin(19, 18); bme.begin(0x76); }
void loop()  { print(measure()); delay(2000); }
