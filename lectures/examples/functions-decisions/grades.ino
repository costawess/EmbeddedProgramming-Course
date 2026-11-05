float average(const float g[], int n) {        // array in, float out
  float sum = 0;
  for (int i = 0; i < n; i++) sum += g[i];
  return sum / n;
}
bool passed(float grade) { return grade >= 5.5; }   // float in, bool out
char letter(float grade) {                          // float in, char out
  if (grade >= 8.0) return 'A';
  if (grade >= 7.0) return 'B';
  return grade >= 5.5 ? 'C' : 'F';
}
String verdict(float grade) { return passed(grade) ? "pass" : "fail"; }
void setup() {
  Serial.begin(115200);
  float grades[] = {7.5, 5.0, 8.2, 6.4, 9.1};
  int n = sizeof(grades) / sizeof(grades[0]);
  for (int i = 0; i < n; i++)
    Serial.printf("student %d: %.1f %c %s\n", i + 1, grades[i],
                  letter(grades[i]), verdict(grades[i]).c_str());
  Serial.printf("group average: %.2f\n", average(grades, n));
}
void loop() {}
