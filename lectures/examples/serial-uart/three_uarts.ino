void setup() {
  Serial.begin(115200);  // UART0 -> USB bridge
  Serial1.begin(9600, SERIAL_8N1, 32, 33);
  Serial2.begin(115200, SERIAL_8N1, 16, 17);

  Serial.println("Debug on UART0");
  Serial1.println("Hello device A");
  Serial2.println("Hello device B");
}

void loop() {
  // Each port has its own available/read/write.
}
