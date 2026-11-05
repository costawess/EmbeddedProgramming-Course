#include <WiFi.h>

const char* SSID = "your-ssid";
const char* PASS = "your-password";

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);              // station (client)
  WiFi.begin(SSID, PASS);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.printf("\nIP: %s  RSSI: %d dBm\n",
                WiFi.localIP().toString().c_str(), WiFi.RSSI());
}

void loop() {}
