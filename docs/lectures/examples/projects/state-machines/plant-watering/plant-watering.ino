// Course-board demo: a potentiometer on AD1 simulates soil moisture.
// The blue LED represents the pump; no pump is connected to a GPIO.
enum WaterState { CHECK_SOIL, WATERING, SOAKING };
WaterState state = CHECK_SOIL;
const int SENSOR = 36, PUMP_LED = 23;
unsigned long enteredAt = 0;

void enterState(WaterState next, unsigned long now) {
  state = next;
  enteredAt = now;
  Serial.printf("state=%d\n", (int)state);
}

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_LED, OUTPUT);
  digitalWrite(PUMP_LED, LOW);
  analogReadResolution(12);
}

void loop() {
  unsigned long now = millis();
  switch (state) {
    case CHECK_SOIL: {
      int moisture = map(analogRead(SENSOR), 0, 4095, 0, 100);
      if (moisture < 30) enterState(WATERING, now);
      break;
    }
    case WATERING:
      if (now - enteredAt >= 10000UL)
        enterState(SOAKING, now);
      break;
    case SOAKING:
      if (now - enteredAt >= 60000UL)
        enterState(CHECK_SOIL, now);
      break;
    default:
      enterState(CHECK_SOIL, now);
      break;
  }
  digitalWrite(PUMP_LED, state == WATERING ? HIGH : LOW);
}
