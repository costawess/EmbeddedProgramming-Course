struct Led {
  int pin;
  unsigned long interval;      // ms
  unsigned long last = 0;      // default values
  bool on = false;
};
Led leds[] = {                 // pin, interval
  {23, 250}, {22, 500}, {21, 1000}, {4, 2000},
};
const int N = sizeof(leds) / sizeof(leds[0]);
void update(Led &led) {        // reference: changes the LED
  if (millis() - led.last >= led.interval) {
    led.last = millis();
    led.on = !led.on;
    digitalWrite(led.pin, led.on);
  }
}
void setup() {
  for (int i = 0; i < N; i++) pinMode(leds[i].pin, OUTPUT);
}
void loop() {
  for (int i = 0; i < N; i++) update(leds[i]);
}
