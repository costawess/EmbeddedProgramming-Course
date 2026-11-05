// CourseBoard.h: what the library offers
#pragma once              // include this file only once
#include <Arduino.h>

void boardBegin();                // LEDs + buttons
void setLed(int index, bool on);  // index 0..3
void showBinary(uint8_t value);   // 4 bits on the LEDs
bool keyPressed(int key);         // key 1 or 2
