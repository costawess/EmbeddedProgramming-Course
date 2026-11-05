const int ledPin = 2;   // constant: never changes
int counter = 0;        // declared + initialised
int lastValue;          // declared only

void setup() {
  Serial.begin(115200);
  counter = 10;         // assignment
  counter = counter + 1;
  Serial.println(counter);   // 11
}

void loop() {}
