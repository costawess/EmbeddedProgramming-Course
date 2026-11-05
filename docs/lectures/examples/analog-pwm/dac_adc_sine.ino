#include <math.h>
const int DAC_PIN = 25;
const int ADC_PIN = 32;
const int N = 250;
const float frequency = 10.0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // ADC: 0..4095
}

void loop() {
  for (int i = 0; i < N; i++) {
    float angle = 2.0 * PI * frequency * i / N;
    int dacValue = 128 + 127 * sin(angle);
    dacWrite(DAC_PIN, dacValue);
    int adcValue = analogRead(ADC_PIN);
    int adc8bit = adcValue * 255 / 4095;
    Serial.printf("DAC:%d,ADC:%d\n", dacValue, adc8bit);
    // delay(5);
  }
}
