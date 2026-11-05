#include "Blinker.h"
Blinker::Blinker(int pin, unsigned long ms)
  : _pin(pin), _interval(ms) {}
void Blinker::begin() { pinMode(_pin, OUTPUT); }
void Blinker::update() {               // non-blocking
  if (millis() - _last >= _interval) {
    _last = millis();
    _on = !_on;
    digitalWrite(_pin, _on);
  }
}
