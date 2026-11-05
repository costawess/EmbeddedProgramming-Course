const uint8_t MODE_BTN_PIN = 18;
const uint8_t SYMBOL_BTN_PIN = 19;
const uint8_t REMATCH_BTN_PIN = 21;
const uint8_t CELL_PINS[9] = {2, 4, 5, 12, 13, 14, 15, 22, 23};

String currentMode = "TRADITIONAL";
char mySymbol = 'X';
bool lastModeBtn = HIGH;
bool lastSymbolBtn = HIGH;
bool lastRematchBtn = HIGH;
bool lastCellState[9];

String rxLine;

void sendMode() {
  Serial.print("MODE:");
  Serial.println(currentMode);
}

void sendSymbol() {
  Serial.print("SYMBOL:SELECTED:");
  Serial.println(mySymbol);
}

void sendMove(uint8_t index) {
  const uint8_t row = index / 3;
  const uint8_t col = index % 3;
  Serial.print("MOVE:");
  Serial.print(row);
  Serial.print(",");
  Serial.print(col);
  Serial.print(",");
  Serial.println(mySymbol);
}

void setup() {
  Serial.begin(115200);
  pinMode(MODE_BTN_PIN, INPUT_PULLUP);
  pinMode(SYMBOL_BTN_PIN, INPUT_PULLUP);
  pinMode(REMATCH_BTN_PIN, INPUT_PULLUP);
  for (int i = 0; i < 9; ++i) {
    pinMode(CELL_PINS[i], INPUT_PULLUP);
    lastCellState[i] = HIGH;
  }
  delay(300);
  sendMode();
  sendSymbol();
}

void parseIncomingLine(const String& line) {
  if (line.startsWith("MODE:")) {
    currentMode = line.substring(5);
  } else if (line.startsWith("SYMBOL:SELECTED:")) {
    char remote = line.charAt(line.length() - 1);
    if (remote == 'X' || remote == 'O') {
      mySymbol = (remote == 'X') ? 'O' : 'X';
    }
  } else if (line == "REMATCH:ACCEPT") {
    // Hook for a buzzer or local reset, if desired.
  }
}

void readIncomingSerial() {
  while (Serial.available()) {
    char c = static_cast<char>(Serial.read());
    if (c == '\n') {
      rxLine.trim();
      if (rxLine.length()) parseIncomingLine(rxLine);
      rxLine = "";
    } else if (c != '\r') {
      rxLine += c;
    }
  }
}

void loop() {
  readIncomingSerial();

  bool modeBtn = digitalRead(MODE_BTN_PIN);
  bool symbolBtn = digitalRead(SYMBOL_BTN_PIN);
  bool rematchBtn = digitalRead(REMATCH_BTN_PIN);

  if (lastModeBtn == HIGH && modeBtn == LOW) {
    currentMode = (currentMode == "TRADITIONAL") ? "SLIDING" : "TRADITIONAL";
    sendMode();
  }
  if (lastSymbolBtn == HIGH && symbolBtn == LOW) {
    mySymbol = (mySymbol == 'X') ? 'O' : 'X';
    sendSymbol();
  }
  if (lastRematchBtn == HIGH && rematchBtn == LOW) {
    Serial.println("REMATCH:REQUEST");
  }

  lastModeBtn = modeBtn;
  lastSymbolBtn = symbolBtn;
  lastRematchBtn = rematchBtn;

  for (uint8_t i = 0; i < 9; ++i) {
    bool current = digitalRead(CELL_PINS[i]);
    if (lastCellState[i] == HIGH && current == LOW) sendMove(i);
    lastCellState[i] = current;
  }
}
