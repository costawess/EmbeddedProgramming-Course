/*
  Blink the four LEDs of the course board
  Author: you, date
*/
#include <Arduino.h>        // 1. libraries
const int LED_PINS[] = {23, 22, 21, 4};   // 2. globals
const int DELAY_MS = 300;
void allLeds(bool on) {      // 3. own functions
  for (int i = 0; i < 4; i++) {
    digitalWrite(LED_PINS[i], on);
  }
}
void setup() {               // 4. runs once
  for (int i = 0; i < 4; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
}
void loop() {                // 5. runs forever
  allLeds(true);  delay(DELAY_MS);
  allLeds(false); delay(DELAY_MS);
}
