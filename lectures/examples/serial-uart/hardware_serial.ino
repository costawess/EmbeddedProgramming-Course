HardwareSerial device(2);     // use UART2

void setup() {
  Serial.begin(115200);                       // USB
  device.begin(9600, SERIAL_8N1, 16, 17);     // RX=16, TX=17
}

void loop() {
  if (device.available()) {
    String line = device.readStringUntil('\n');
    line.trim();               // remove \r and spaces
    Serial.print("Received: ");
    Serial.println(line);
  }
}
