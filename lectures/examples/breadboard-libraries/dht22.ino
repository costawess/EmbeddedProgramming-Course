#include <DHT.h>

DHT dht(25, DHT22);          // data pin, sensor type

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();   // Celsius
  float h = dht.readHumidity();      // %
  if (isnan(t) || isnan(h)) {
    Serial.println("DHT read failed");
  } else {
    Serial.printf("T = %.1f C  RH = %.0f %%\n", t, h);
  }
  delay(2000);               // DHT22: max one read per 2 s
}
