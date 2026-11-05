const unsigned long DEBOUNCE_MS = 50;
volatile unsigned long lastPressTime = 0;
volatile uint32_t presses = 0;
void IRAM_ATTR onKey1() {
  unsigned long now = millis();
  if (now - lastPressTime > DEBOUNCE_MS) {
    lastPressTime = now;
    presses++;          // valid press
  }
}
