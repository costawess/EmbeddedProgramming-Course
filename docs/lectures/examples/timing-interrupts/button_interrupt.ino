const int KEY1 = 34;               // active HIGH
const int LED_GREEN = 22;
volatile bool pressedFlag = false;
volatile uint32_t pressCount = 0;
void IRAM_ATTR onKey1() {
  pressedFlag = true;              // short!
  pressCount++;
}
void setup() {
  Serial.begin(115200);
  pinMode(KEY1, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(KEY1), onKey1, RISING);
}
void loop() {
  if (pressedFlag) {               // handle the event here
    pressedFlag = false;
    digitalWrite(LED_GREEN, !digitalRead(LED_GREEN));
    Serial.printf("presses: %lu\n", (unsigned long) pressCount);
  }
  delay(2000);   // ISR still counts rising edges while loop waits
}
