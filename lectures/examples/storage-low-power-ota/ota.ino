#include <WiFi.h>
#include <ArduinoOTA.h>

void setup() {
  /* ... connect to Wi-Fi ... */
  ArduinoOTA.setHostname("esp32-lab-01");
  ArduinoOTA.setPassword("change-me");
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();     // keep loop non-blocking
  /* ... application code ... */
}
