hw_timer_t *timer = nullptr;
volatile bool tick = false;
const int LED_PIN = 2;
bool ledOn = false;
void ARDUINO_ISR_ATTR onTimer() { tick = true; }
void setup() {
  pinMode(LED_PIN, OUTPUT);
  timer = timerBegin(1000000);           // 1 MHz: 1 tick = 1 us
  timerStop(timer);                     // pause while configuring
  timerAttachInterrupt(timer, &onTimer);
  // 0.5 s alarm, auto-reload, repeat forever:
  timerAlarm(timer, 500000, true, 0);
  timerRestart(timer);                  // reset count to zero
  timerStart(timer);                    // start counting now
}

void loop() {
  if (tick) {
    tick = false;
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn);
  }
}
