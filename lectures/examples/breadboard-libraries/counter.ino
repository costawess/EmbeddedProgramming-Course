#include "CourseBoard.h"    // our own tab

uint8_t counter = 0;
bool lastKey = false;

void setup() {
  boardBegin();
}

void loop() {
  bool key = keyPressed(1);
  if (key && !lastKey) {      // new press
    counter++;
    showBinary(counter);      // 0..15 on the LEDs
  }
  lastKey = key;
  delay(20);
}
