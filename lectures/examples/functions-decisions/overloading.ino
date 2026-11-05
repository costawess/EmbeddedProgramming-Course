// same name, different parameter lists: overloading
float area(float r)          { return PI * r * r; }   // circle
float area(float w, float h) { return w * h; }        // rectangle
float area(float a, float b, float c) {               // triangle (Heron)
  float s = (a + b + c) / 2;
  return sqrt(s * (s - a) * (s - b) * (s - c));
}
// default values: the caller may leave the last parameters out
void blink(int pin, int times = 1, int ms = 200) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH); delay(ms); digitalWrite(pin, LOW); delay(ms);
  }
}
void setup() {
  Serial.begin(115200);
  pinMode(23, OUTPUT);
  Serial.println(area(1.0));            // circle:    3.14
  Serial.println(area(2.0, 3.0));       // rectangle: 6.00
  Serial.println(area(3.0, 4.0, 5.0));  // triangle:  6.00
  blink(23);  blink(23, 3);  blink(23, 3, 50);
}
void loop() {}
