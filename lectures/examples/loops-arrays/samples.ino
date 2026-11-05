const int N = 10;
int samples[N];

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < N; i++) {     // fill
    samples[i] = analogRead(36);
    delay(20);
  }

  long sum = 0;                     // average
  int minV = samples[0];
  int maxV = samples[0];
  for (int i = 0; i < N; i++) {
    sum += samples[i];
    if (samples[i] < minV) minV = samples[i];
    if (samples[i] > maxV) maxV = samples[i];
  }
  Serial.printf("avg=%ld min=%d max=%d\n",
                sum / N, minV, maxV);
}

void loop() {}
