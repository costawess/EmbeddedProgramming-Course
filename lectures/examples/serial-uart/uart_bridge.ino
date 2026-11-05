// UART2 on GPIO16 (RX2) / GPIO17 (TX2)
void setup() {
  Serial.begin(115200);                      // USB / PC
  Serial2.begin(9600, SERIAL_8N1, 16, 17);   // baud, frame, RX, TX
}

void loop() {
  while (Serial2.available()) Serial.write(Serial2.read());  // device -> PC
  while (Serial.available())  Serial2.write(Serial.read());  // PC -> device
}
