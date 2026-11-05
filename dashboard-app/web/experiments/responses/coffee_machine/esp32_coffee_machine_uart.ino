enum MachineState {
  WAIT_START,
  WAIT_DRINK,
  WAIT_SUGAR,
  WAIT_STRENGTH,
  WAIT_MILK,
  PREPARING,
  READY_STATE
};

MachineState machineState = WAIT_START;
String selectedDrink;
String sugarLevel;
String strengthLevel;
String milkOption;
unsigned long prepareStartedMs = 0;
bool prepareStateSent = false;
String rxLine;

void resetMachine() {
  selectedDrink = "";
  sugarLevel = "";
  strengthLevel = "";
  milkOption = "";
  machineState = WAIT_START;
  prepareStartedMs = 0;
  prepareStateSent = false;
  Serial.println("INSERT COIN");
}

bool startsWithLine(const String& line, const char* prefix) {
  return line.startsWith(prefix);
}

void handleCommand(const String& line) {
  if (machineState == WAIT_START && line == "s") {
    machineState = WAIT_DRINK;
    return;
  }

  if (machineState == WAIT_DRINK && startsWithLine(line, "SELECTED:")) {
    selectedDrink = line.substring(9);
    machineState = WAIT_SUGAR;
    Serial.println("STATE:CUSTOMIZE");
    return;
  }

  if (machineState == WAIT_SUGAR && startsWithLine(line, "SUGAR:")) {
    sugarLevel = line.substring(6);
    machineState = WAIT_STRENGTH;
    Serial.println("SUGAR:OK");
    return;
  }

  if (machineState == WAIT_STRENGTH && startsWithLine(line, "STRENGTH:")) {
    strengthLevel = line.substring(9);
    machineState = WAIT_MILK;
    Serial.println("STRENGTH:OK");
    return;
  }

  if (machineState == WAIT_MILK && startsWithLine(line, "MILK:")) {
    milkOption = line.substring(5);
    machineState = PREPARING;
    prepareStartedMs = millis();
    prepareStateSent = false;
    Serial.println("MILK:OK");
    return;
  }
}

void readSerialLines() {
  while (Serial.available()) {
    char c = static_cast<char>(Serial.read());
    if (c == '\n') {
      rxLine.trim();
      if (rxLine.length()) handleCommand(rxLine);
      rxLine = "";
    } else if (c != '\r') {
      rxLine += c;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(400);
  resetMachine();
}

void loop() {
  readSerialLines();

  if (machineState == PREPARING) {
    const unsigned long elapsed = millis() - prepareStartedMs;
    if (!prepareStateSent && elapsed >= 500) {
      Serial.println("STATE:PREPARE");
      prepareStateSent = true;
    }
    if (elapsed >= 4500) {
      Serial.println("READY!");
      machineState = READY_STATE;
      prepareStartedMs = millis();
    }
  } else if (machineState == READY_STATE) {
    if (millis() - prepareStartedMs >= 3000) {
      resetMachine();
    }
  }
}
