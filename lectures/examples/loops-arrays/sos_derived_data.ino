const char pattern[] = "...---...";
const int SYMBOLS = sizeof(pattern) - 1;
const int DOT = 500, DASH = 3 * DOT;
int onTimes[SYMBOLS];

void setup() {
  for (int i = 0; i < SYMBOLS; i++) {
    if (pattern[i] == '.') {
      onTimes[i] = DOT;
    } else {
      onTimes[i] = DASH;
    }
  }
}
void loop() {
  // Use onTimes[] to play the pattern.
}
