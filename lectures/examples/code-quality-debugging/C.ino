int leds[] = {23, 22, 21};
void setup() {
  for (int i = 0; i <= 3; i++)
    pinMode(leds[i], OUTPUT);
}
