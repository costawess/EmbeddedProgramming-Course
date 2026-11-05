struct Point {
  float x, y;
};
struct Rectangle {
  Point corner;                 // a struct inside a struct
  float width, height;
};
float area(const Rectangle &r) {        // const reference: no copy
  return r.width * r.height;
}
Point center(const Rectangle &r) {      // returns a struct
  return { r.corner.x + r.width / 2, r.corner.y + r.height / 2 };
}
float distance(Point a, Point b) {      // by value: small struct
  return sqrt(sq(a.x - b.x) + sq(a.y - b.y));
}
void setup() {
  Serial.begin(115200);
  Rectangle box = { {0, 0}, 4, 2 };      // corner (0,0), 4 x 2
  Point c = center(box);                 // (2, 1)
  Serial.printf("area %.1f, center (%.1f, %.1f)\n", area(box), c.x, c.y);
  Serial.printf("distance to origin %.2f\n", distance(c, {0, 0}));
}
void loop() {}
