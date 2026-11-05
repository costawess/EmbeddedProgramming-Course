void setup() {
  Serial.begin(115200);          // UART0 -> USB
  delay(500);
  Serial.println("Hello, ESP32!");
  Serial.printf("CPU: %u MHz, cores: %u\n",
                (unsigned) getCpuFrequencyMhz(),
                (unsigned) ESP.getChipCores());
}

void loop() {
  Serial.printf("Uptime: %lu ms\n", millis());
  delay(1000);
}
