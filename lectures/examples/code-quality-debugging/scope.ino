void loop() {
  int x = 10;
  if (x > 5) {
    int y = 20;
    Serial.println(x);   // OK
    Serial.println(y);   // OK
  }
  Serial.println(x);     // OK
  Serial.println(y);     // ERROR: y not
}                        // declared in this scope
