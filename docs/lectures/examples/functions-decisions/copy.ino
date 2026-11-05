void addTen(int x) {
  x = x + 10;            // changes the copy
  Serial.println(x);     // 15
}

int plusTen(int x) {
  return x + 10;         // returns a new value
}

void setup() {
  Serial.begin(115200);
  int n = 5;
  addTen(n);
  Serial.println(n);     // still 5
  n = plusTen(n);
  Serial.println(n);     // 15
}
void loop() {}
