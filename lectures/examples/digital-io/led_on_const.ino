// Version 2: a named constant
const int LED_BLUE = 23;

void setup() {
  pinMode(LED_BLUE, OUTPUT);     // pin as output
  digitalWrite(LED_BLUE, HIGH);  // 3.3 V: LED on
}
void loop() {}
