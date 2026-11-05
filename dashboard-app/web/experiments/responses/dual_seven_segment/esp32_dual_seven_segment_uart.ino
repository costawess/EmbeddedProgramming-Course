String LUT[10] = { // Segment bits in ABCDEFGDP order
  "11111100",  // 0
  "01100000",  // 1
  "11011010",  // 2
  "11110010",  // 3
  "01100110",  // 4
  "10110110",  // 5
  "10111110",  // 6
  "11100000",  // 7
  "11111110",  // 8
  "11110110"   // 9
};

void setup() {
  Serial.begin(115200);
}

void loop() {
  for (int i = 0; i < 3; i++) {
    Serial.print("D1:");
    Serial.println(LUT[i]);
    delay(500);

    // now implement the second digit! :)
  }
}
