int sum = 10 + 20 + 30;
int avg1 = sum / 4;             // 15: wrong count
int avg2 = sum / 3;             // 20: correct

float r1 = 7 / 2;               // 3.0 (!)
float r2 = 7 / 2.0;             // 3.5
float r3 = (float) 7 / 2;       // 3.5 (cast)

uint8_t level = 255;
level = level + 1;              // 0 (overflow)

int big = 2147483647;
big = big + 1;                  // -2147483648
