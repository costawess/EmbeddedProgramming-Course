enum State { IDLE, WASHING, PAUSED, SPINNING, DRAINING };
State state = IDLE;
const int KEY1 = 34;
bool lastKey = LOW;
void onButton() {                 // event: one button press
  switch (state) {
    case IDLE:     state = WASHING;  break;
    case WASHING:  state = PAUSED;   break;
    case PAUSED:   state = WASHING;  break;
    case SPINNING: state = DRAINING; break;   // safety stop
    default:       break;                     // DRAINING: ignore
  }
  Serial.printf("new state: %d\n", state);
}
void setup() { Serial.begin(115200); pinMode(KEY1, INPUT); }

void loop() {
  bool key = digitalRead(KEY1);
  if (key == HIGH && lastKey == LOW) onButton();   // rising edge
  lastKey = key;
  delay(20);                                       // simple debounce
}
