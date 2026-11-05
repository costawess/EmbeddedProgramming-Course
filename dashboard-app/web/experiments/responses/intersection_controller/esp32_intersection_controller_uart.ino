const uint8_t WALK_BUTTON_PIN = 18;
const uint8_t SIDE_SENSOR_PIN = 19;

enum IntersectionState {
  MAIN_GREEN,
  MAIN_YELLOW,
  SIDE_GREEN,
  WALK
};

IntersectionState currentState = MAIN_GREEN;
unsigned long stateStartedMs = 0;
bool pedestrianRequest = false;
bool lastButtonState = HIGH;
bool lastSensorState = HIGH;

void sendBool(const char* key, bool value) {
  Serial.print(key);
  Serial.print(":");
  Serial.println(value ? "ON" : "OFF");
}

void sendState(IntersectionState state) {
  switch (state) {
    case MAIN_GREEN: Serial.println("STATE:MAIN_GREEN"); break;
    case MAIN_YELLOW: Serial.println("STATE:MAIN_YELLOW"); break;
    case SIDE_GREEN: Serial.println("STATE:SIDE_GREEN"); break;
    case WALK: Serial.println("STATE:WALK"); break;
  }
}

void setState(IntersectionState next) {
  currentState = next;
  stateStartedMs = millis();
  sendState(next);
}

void setup() {
  Serial.begin(115200);
  pinMode(WALK_BUTTON_PIN, INPUT_PULLUP);
  pinMode(SIDE_SENSOR_PIN, INPUT_PULLUP);
  delay(250);
  sendState(currentState);
  sendBool("BUTTON", false);
  sendBool("SENSOR", false);
}

void loop() {
  const bool buttonPressed = digitalRead(WALK_BUTTON_PIN) == LOW;
  const bool sensorActive = digitalRead(SIDE_SENSOR_PIN) == LOW;

  if (lastButtonState == HIGH && buttonPressed) {
    pedestrianRequest = true;
    sendBool("BUTTON", true);
  } else if (lastButtonState == LOW && !buttonPressed) {
    sendBool("BUTTON", false);
  }
  lastButtonState = buttonPressed ? LOW : HIGH;

  if (lastSensorState == HIGH && sensorActive) sendBool("SENSOR", true);
  else if (lastSensorState == LOW && !sensorActive) sendBool("SENSOR", false);
  lastSensorState = sensorActive ? LOW : HIGH;

  const unsigned long elapsed = millis() - stateStartedMs;

  switch (currentState) {
    case MAIN_GREEN:
      if (pedestrianRequest || sensorActive || elapsed >= 3500) setState(MAIN_YELLOW);
      break;
    case MAIN_YELLOW:
      if (elapsed >= 1200) {
        if (pedestrianRequest) setState(WALK);
        else setState(SIDE_GREEN);
      }
      break;
    case SIDE_GREEN:
      if (elapsed >= 2800) setState(MAIN_YELLOW);
      break;
    case WALK:
      if (elapsed >= 2200) {
        pedestrianRequest = false;
        setState(MAIN_GREEN);
      }
      break;
  }
}
