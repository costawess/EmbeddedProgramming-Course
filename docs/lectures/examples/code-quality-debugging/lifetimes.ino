int globalCount = 0;          // whole program

void countCalls() {
  int localCount = 0;         // new every call
  static int staticCount = 0; // keeps its value
  globalCount++;
  localCount++;
  staticCount++;
  Serial.printf("g=%d l=%d s=%d\n",
                globalCount, localCount, staticCount);
}

void setup() {
  Serial.begin(115200);
  countCalls();   // g=1 l=1 s=1
  countCalls();   // g=2 l=1 s=2
  countCalls();   // g=3 l=1 s=3
}
void loop() {}
