const int LEDS[] = {23, 22, 21, 4};

int  readPotPercent()   { return map(analogRead(36), 0, 4095, 0, 100); }
bool isPressed(int pin) { return digitalRead(pin) == HIGH; }  // course board
void alarm(bool on)     { digitalWrite(2, on); }
void showLevel(int percent) {                    // 0..100 % -> 0..4 LEDs
  for (int i = 0; i < 4; i++) digitalWrite(LEDS[i], percent > i * 25);
}

void setup() {
  for (int i = 0; i < 4; i++) pinMode(LEDS[i], OUTPUT);
  pinMode(2, OUTPUT);
  pinMode(34, INPUT);
}

void loop() {
  int level = readPotPercent();
  showLevel(level);
  alarm(level > 90 || isPressed(34));
  delay(50);
}
