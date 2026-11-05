// Course board: KEY1 starts/cancels/acknowledges a fixed 10-second timer.
enum TimerState { READY, RUNNING, DONE };
TimerState state = READY;
const int BUTTON = 34, BLUE_LED = 23, RED_LED = 21;
const unsigned long DURATION = 10000UL;
unsigned long enteredAt = 0;

bool pressEvent(unsigned long now) {
  static bool lastRaw = false, stable = false;
  static unsigned long changedAt = 0;
  bool raw = digitalRead(BUTTON) == HIGH;
  if (raw != lastRaw) {
    lastRaw = raw;
    changedAt = now;
  }
  if (now - changedAt < 30UL || raw == stable) return false;
  stable = raw;
  return stable;  // true only on a debounced LOW-to-HIGH edge
}

void enterState(TimerState next, unsigned long now) {
  state = next;
  enteredAt = now;
  Serial.printf("state=%d\n", (int)state);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON, INPUT);  // course-board external pull-down
  pinMode(BLUE_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(RED_LED, LOW);
}

void loop() {
  unsigned long now = millis();
  bool pressed = pressEvent(now);
  switch (state) {
    case READY:
      if (pressed) enterState(RUNNING, now);
      break;
    case RUNNING:
      if (pressed) enterState(READY, now);  // cancel has priority
      else if (now - enteredAt >= DURATION) enterState(DONE, now);
      break;
    case DONE:
      if (pressed) enterState(READY, now);
      break;
    default:
      enterState(READY, now);
      break;
  }
  digitalWrite(BLUE_LED, state == RUNNING ? HIGH : LOW);
  bool flash = ((now - enteredAt) / 250UL) % 2 == 0;
  digitalWrite(RED_LED, state == DONE && flash ? HIGH : LOW);
}
