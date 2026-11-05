const int LED_BLUE   = 23;
const int LED_GREEN  = 22;
const int LED_RED    = 21;
const int LED_ORANGE = 4;
void setup() {
  pinMode(LED_BLUE, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_ORANGE, OUTPUT);
}
void loop() {
  digitalWrite(LED_BLUE, HIGH);   delay(200);
  digitalWrite(LED_GREEN, HIGH);  delay(200);
  digitalWrite(LED_RED, HIGH);    delay(200);
  digitalWrite(LED_ORANGE, HIGH); delay(200);
  digitalWrite(LED_BLUE, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_ORANGE, LOW);
  delay(500);
}
