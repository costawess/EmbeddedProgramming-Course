const int LED = 23, ON_BUTTON = 34, OFF_BUTTON = 35;

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(ON_BUTTON, INPUT);
  pinMode(ON_BUTTON, INPUT); // copy/paste bug!
  digitalWrite(LED, LOW);
}

void loop() {
  if (digitalRead(ON_BUTTON) == HIGH) {
    digitalWrite(LED, HIGH);
  }
  if (digitalRead(OFF_BUTTON) == HIGH) {
    digitalWrite(LED, LOW);
  }
}
