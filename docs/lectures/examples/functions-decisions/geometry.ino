// PI is already defined by Arduino.h
float circleArea(float r)             { return PI * r * r; }
float circleCircumference(float r)    { return 2 * PI * r; }
float rectangleArea(float w, float h) { return w * h; }
float triangleArea(float b, float h)  { return 0.5 * b * h; }

float cylinderVolume(float r, float h) {
  return circleArea(r) * h;           // a function using a function
}

void setup() {
  Serial.begin(115200);
  Serial.printf("circle r=2:       %.2f\n", circleArea(2));
  Serial.printf("circumference:    %.2f\n", circleCircumference(2));
  Serial.printf("rectangle 3 x 4:  %.2f\n", rectangleArea(3, 4));
  Serial.printf("triangle 6, 2:    %.2f\n", triangleArea(6, 2));
  Serial.printf("cylinder r=1 h=5: %.2f\n", cylinderVolume(1, 5));
  float total = circleArea(1) + rectangleArea(2, 3);  // in an expression
  Serial.printf("total area:       %.2f\n", total);
}
void loop() {}
