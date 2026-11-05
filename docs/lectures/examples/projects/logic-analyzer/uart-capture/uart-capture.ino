void setup() {
  // UART2: baud, format, RX, TX
  Serial2.begin(115200, SERIAL_8N1, 16, 17);
}

void loop() {
  Serial2.write('A'); // one byte: 0x41
  delay(20);
}
