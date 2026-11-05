const int N = 16;
int buffer[N];          // last N readings
int pos = 0;            // where the next one goes
long sum = 0;

void setup() { Serial.begin(115200); }

void loop() {
  int raw = analogRead(36);
  sum -= buffer[pos];         // remove oldest
  buffer[pos] = raw;          // store newest
  sum += raw;
  pos = (pos + 1) % N;        // wrap around
  int filtered = sum / N;

  Serial.printf("raw:%d,filtered:%d\n", raw, filtered);
  delay(20);
}
