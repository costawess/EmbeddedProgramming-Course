struct Student { String name; int number; float grade; };
Student group[] = {
  {"Anna", 4512, 7.8}, {"Bram", 4519, 5.2},
  {"Chen", 4530, 8.9}, {"Dewi", 4544, 6.1} };
const int N = sizeof(group) / sizeof(group[0]);
float averageGrade(const Student g[], int n) {
  float sum = 0;
  for (int i = 0; i < n; i++) sum += g[i].grade;
  return sum / n;
}
int bestIndex(const Student g[], int n) {
  int best = 0;
  for (int i = 1; i < n; i++) if (g[i].grade > g[best].grade) best = i;
  return best;
}
void setup() {
  Serial.begin(115200);
  for (int i = 0; i < N; i++)
    Serial.printf("%-5s %.1f\n", group[i].name.c_str(), group[i].grade);
  Serial.printf("average %.2f, best: %s\n", averageGrade(group, N),
                group[bestIndex(group, N)].name.c_str());
}
void loop() {}
