// CourseBoard.cpp: how it works
#include "CourseBoard.h"

// static: only visible inside this file (private)
static const int LEDS[4] = {23, 22, 21, 4};
static const int KEYS[2] = {34, 35};

void boardBegin() {
  for (int i = 0; i < 4; i++) pinMode(LEDS[i], OUTPUT);
  for (int i = 0; i < 2; i++) pinMode(KEYS[i], INPUT);
}

void setLed(int index, bool on) {
  if (index >= 0 && index < 4) digitalWrite(LEDS[index], on);
}

void showBinary(uint8_t value) {
  for (int i = 0; i < 4; i++) setLed(i, (value >> i) & 1);
}

bool keyPressed(int key) {
  return digitalRead(KEYS[key - 1]) == HIGH;   // active HIGH
}
