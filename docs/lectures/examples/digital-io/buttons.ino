const int KEY1 = 34;        // active HIGH (pull-down)
const int KEY2 = 35;
const int LED_BLUE = 23;
const int LED_RED  = 21;
void setup() {
  Serial.begin(115200);
  pinMode(KEY1, INPUT);     // no internal pull on 34/35
  pinMode(KEY2, INPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(LED_RED, OUTPUT);
}
void loop() {
  bool key1 = digitalRead(KEY1);   // true = pressed
  bool key2 = digitalRead(KEY2);
  digitalWrite(LED_BLUE, key1);    // LED follows button
  digitalWrite(LED_RED, key2);
  Serial.printf("KEY1=%d KEY2=%d\n", key1, key2);
  delay(100);
}
