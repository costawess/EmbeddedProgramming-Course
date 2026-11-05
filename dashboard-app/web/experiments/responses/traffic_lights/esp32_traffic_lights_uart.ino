const uint8_t RED_BTN_PIN = 18;
const uint8_t YELLOW_BTN_PIN = 19;
const uint8_t GREEN_BTN_PIN = 21;

String currentColor = "RED";
unsigned long lastCycleMs = 0;
const unsigned long AUTO_RED_MS = 2600;
const unsigned long AUTO_GREEN_MS = 3600;
const unsigned long AUTO_YELLOW_MS = 1200;

bool lastRedBtn = HIGH;
bool lastYellowBtn = HIGH;
bool lastGreenBtn = HIGH;

void sendColor(const String& color) {
  currentColor = color;
  Serial.println(color == "RED" ? "r" : color == "YELLOW" ? "y" : "g");
}

void setup() {
  Serial.begin(115200);
  pinMode(RED_BTN_PIN, INPUT_PULLUP);
  pinMode(YELLOW_BTN_PIN, INPUT_PULLUP);
  pinMode(GREEN_BTN_PIN, INPUT_PULLUP);
  delay(300);
  sendColor(currentColor);
  lastCycleMs = millis();
}

void handleButton(uint8_t pin, bool& lastState, const String& color) {
  bool currentState = digitalRead(pin);
  if (lastState == HIGH && currentState == LOW) {
    sendColor(color);
    lastCycleMs = millis();
  }
  lastState = currentState;
}

void loop() {
  handleButton(RED_BTN_PIN, lastRedBtn, "RED");
  handleButton(YELLOW_BTN_PIN, lastYellowBtn, "YELLOW");
  handleButton(GREEN_BTN_PIN, lastGreenBtn, "GREEN");

  const unsigned long now = millis();
  const unsigned long elapsed = now - lastCycleMs;

  if (currentColor == "RED" && elapsed >= AUTO_RED_MS) {
    sendColor("GREEN");
    lastCycleMs = now;
  } else if (currentColor == "GREEN" && elapsed >= AUTO_GREEN_MS) {
    sendColor("YELLOW");
    lastCycleMs = now;
  } else if (currentColor == "YELLOW" && elapsed >= AUTO_YELLOW_MS) {
    sendColor("RED");
    lastCycleMs = now;
  }
}
