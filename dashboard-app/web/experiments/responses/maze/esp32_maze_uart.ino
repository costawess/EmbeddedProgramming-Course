/* MAZE
In this experiment you send via UART the words: UP, DOWN, LEFT, RIGHT and control the robot on a Maze!
Objective: reach the end without touching the walls!!
*/

void setup() {
  // start serial communication at 115200 baud rate
  Serial.begin(115200);
}

void loop() {

  // maze solution (testing...)
  Serial.println("START");
  delay(500);
  Serial.println("RIGHT");
  delay(500);
  Serial.println("RIGHT");
  delay(500);

  // continue with the rest of the maze solution :)

  // Serial.println("LEFT");
  // Serial.println("UP");
}