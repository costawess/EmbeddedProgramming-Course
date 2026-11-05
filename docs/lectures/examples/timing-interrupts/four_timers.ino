hw_timer_t *timer1 = nullptr;
hw_timer_t *timer2 = nullptr;
hw_timer_t *timer3 = nullptr;
hw_timer_t *timer4 = nullptr;

void setup() {
  Serial.begin(115200);

  timer1 = timerBegin(1000000);
  timer2 = timerBegin(1000000);
  timer3 = timerBegin(1000000);
  timer4 = timerBegin(1000000);
}

void loop() {}
