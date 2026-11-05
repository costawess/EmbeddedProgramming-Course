// Configuration fragment: NO button to 3V3,
// external pull-down already on the board.
void setup() {
  pinMode(34, INPUT);
  attachInterrupt(digitalPinToInterrupt(34),
                  onPress, RISING);
}
