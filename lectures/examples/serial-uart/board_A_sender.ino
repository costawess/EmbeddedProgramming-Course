// Board A: sends the state of KEY1
void setup() {
  pinMode(34, INPUT);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
}

void loop() {
  bool pressed = digitalRead(34);
  Serial2.println(pressed ? "1" : "0");
  delay(100);
}
