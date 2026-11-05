hw_timer_t *timer = nullptr;
volatile bool alarmSeen = false;
void ARDUINO_ISR_ATTR onTimer() {
  alarmSeen = true;
}
void setup() {
  Serial.begin(115200);
  timer = timerBegin(2000); // 2000 ticks/s
  if (!timer) return;
  timerStop(timer);
  timerAttachInterrupt(timer, &onTimer);
  timerAlarm(timer, 2000, true, 0);
  timerRestart(timer);
  timerStart(timer);
}
void loop() {
  if (!timer) return;
  const uint32_t pulse = alarmSeen ? 2000 : 0;
  alarmSeen = false;
  Serial.printf("Count:%llu,ISR:%lu\n",
    (unsigned long long)timerRead(timer),
    (unsigned long)pulse);
  delay(20); // 50 plot samples/s
}
