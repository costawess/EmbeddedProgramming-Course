const int LED_GREEN = 22;

void setup() {
  Serial.begin(115200);
  pinMode(LED_GREEN, OUTPUT);
  Serial.println("Type ON or OFF");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();             // remove \r and spaces
    cmd.toUpperCase();      // on = ON
    if (cmd == "ON") {
      digitalWrite(LED_GREEN, HIGH);
      Serial.println("LED on");
    } else if (cmd == "OFF") {
      digitalWrite(LED_GREEN, LOW);
      Serial.println("LED off");
    } else {
      Serial.println("Unknown command: " + cmd);
    }
  }
}
