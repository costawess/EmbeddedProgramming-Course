#include <WiFi.h>
#include <WebServer.h>
WebServer server(80);
const int LED_PIN = 2;
void handleRoot() {
  server.send(200, "text/html",
    "<h1>ESP32</h1><a href='/on'>ON</a> | <a href='/off'>OFF</a>");
}
void setup() {
  pinMode(LED_PIN, OUTPUT);
  /* ... connect to Wi-Fi as on the previous slide ... */
  server.on("/", handleRoot);
  server.on("/on",  [] { digitalWrite(LED_PIN, HIGH); handleRoot(); });
  server.on("/off", [] { digitalWrite(LED_PIN, LOW);  handleRoot(); });
  server.begin();
}
void loop() {
  server.handleClient();       // must be called often
}
