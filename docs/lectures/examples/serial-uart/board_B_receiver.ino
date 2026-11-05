// Board B: lights the blue LED
void setup() {
  pinMode(23, OUTPUT);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
}

void loop() {
  if (Serial2.available()) {
    String msg = Serial2.readStringUntil('\n');
    msg.trim();
    digitalWrite(23, msg == "1");
  }
}
