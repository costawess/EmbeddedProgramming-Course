const int LED_PIN = 21;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  int temperature = 32;

  // Choose a value with if / else:
  int ledState;
  if (temperature > 30) {
    ledState = HIGH;
  } else {
    ledState = LOW;
  }

  // The same choice with the ternary operator:
  ledState = (temperature > 30) ? HIGH : LOW;
  digitalWrite(LED_PIN, ledState);
  Serial.println(temperature > 30 ? "hot" : "OK");
}
void loop() {}
