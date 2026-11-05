#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>       // library by Benoit Blanchon (v7)

const char* URL = "https://api.open-meteo.com/v1/forecast"
                  "?latitude=53.22&longitude=6.57&current=temperature_2m";

void printTemperature() {
  WiFiClientSecure client;
  client.setInsecure();        // lab only: skips certificate check
  HTTPClient http;
  http.begin(client, URL);
  int code = http.GET();
  if (code == HTTP_CODE_OK) {
    JsonDocument doc;
    deserializeJson(doc, http.getString());
    float t = doc["current"]["temperature_2m"];
    Serial.printf("Groningen: %.1f C\n", t);
  } else {
    Serial.printf("HTTP error %d\n", code);
  }
  http.end();
}
