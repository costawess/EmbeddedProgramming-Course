struct Student {          // a new type
  String name;            // members
  int    number;
  float  grade;
};                        // <- semicolon!
void setup() {
  Serial.begin(115200);
  Student a = {"Anna", 4512, 7.8};  // in order
  Student b;
  b.name   = "Bram";                // dot operator
  b.number = 4519;
  b.grade  = 5.2;
  b.grade += 0.5;                   // members are variables
  Student copy = a;                 // copies all members
  Serial.printf("%s (%d): %.1f\n",
                a.name.c_str(), a.number, a.grade);
}
void loop() {}
