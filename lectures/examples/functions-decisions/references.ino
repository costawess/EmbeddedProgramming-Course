// & = reference: the function works on the caller's variable
void rectangle(float w, float h, float &area, float &perimeter) {
  area = w * h;
  perimeter = 2 * (w + h);
}
void minMax(const float v[], int n, float &lo, float &hi) {
  lo = hi = v[0];
  for (int i = 1; i < n; i++) {
    if (v[i] < lo) lo = v[i];
    if (v[i] > hi) hi = v[i];
  }
}
void setup() {
  Serial.begin(115200);
  float a, p;
  rectangle(3, 4, a, p);                        // a = 12, p = 14
  Serial.printf("area %.1f, perimeter %.1f\n", a, p);
  float grades[] = {7.5, 5.0, 8.2, 6.4, 9.1};
  float lowest, highest;
  minMax(grades, 5, lowest, highest);
  Serial.printf("lowest %.1f, highest %.1f\n", lowest, highest);
}
void loop() {}
