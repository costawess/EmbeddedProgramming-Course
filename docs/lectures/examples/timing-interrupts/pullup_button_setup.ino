// Alternative configuration fragment:
// use an internal pull-up on GPIO25.
void setup() {
  pinMode(25, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(25),
                  onPress, FALLING);
}
