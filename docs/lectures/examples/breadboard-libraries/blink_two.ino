#include "Blinker.h"
Blinker blue(23, 250), red(21, 1000);   // two objects
void setup() { blue.begin(); red.begin(); }
void loop()  { blue.update(); red.update(); }
