const int THRESHOLD = 30;

void setup() { Serial.begin(115200); }

void loop() {
  int t = touchRead(T0);      // T0 = GPIO4
  Serial.println(t);           // try the Plotter
  if (t < THRESHOLD) Serial.println("Touched!");
  delay(100);
}
