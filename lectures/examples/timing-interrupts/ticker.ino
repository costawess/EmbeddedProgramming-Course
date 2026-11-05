#include <Ticker.h>

Ticker sensorTicker;
Ticker ledTicker;
const int LED_BLUE = 23;
bool ledOn = false;

void blinkLed() {
  ledOn = !ledOn;
  digitalWrite(LED_BLUE, ledOn);
}

void readSensor() {
  Serial.println(analogRead(36));
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BLUE, OUTPUT);
  ledTicker.attach(0.5, blinkLed);       // every 0.5 s
  sensorTicker.attach_ms(100, readSensor); // every 100 ms
}

void loop() {}       // empty: the tickers do the work
