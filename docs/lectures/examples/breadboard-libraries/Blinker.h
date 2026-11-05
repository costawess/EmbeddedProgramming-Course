#pragma once
#include <Arduino.h>
class Blinker {
  public:                                  // what users may call
    Blinker(int pin, unsigned long ms);    // constructor
    void begin();
    void update();                         // call often in loop()
  private:                                 // internal state
    int _pin;
    unsigned long _interval;
    unsigned long _last = 0;
    bool _on = false;
};
