// Upload the same sketch to both ESP32 boards.
// Board A TX17 -> Board B RX16
// Board B TX17 -> Board A RX16
// Board A GND  -> Board B GND
// Each board connects over USB to its own browser page at 115200 baud.
// Connect both pages, then choose X or O on ONE page; that player starts.

void setup() {
  Serial.begin(115200);  // USB: browser page
  Serial2.begin(115200, SERIAL_8N1, 16, 17); // UART: other ESP32
}

void loop() {
  // Forward browser commands to the other ESP32.
    
  // Exercise 1: Implement the code to forward the browser commands to the other ESP32. Use Serial.available() and Serial.read() to read from the USB serial port, and Serial2.write() to send the data to the other ESP32 over UART. Make sure to check if the USB is available before sending data.

  //CODE HERE

  while (Serial.available() > 0) {
    Serial2.write(Serial.read());
  }

  // Exercise 2: Implement the code to forward the other ESP32's commands to this browser page. Use Serial2.available() and Serial2.read() to read from the UART serial port, and Serial.write() to send the data to the USB serial port. Make sure to check if the UART is available before sending data.

  //CODE HERE

  // Forward the other ESP32's commands to this browser page.
  while (Serial2.available() > 0) {
    Serial.write(Serial2.read());
  }
}