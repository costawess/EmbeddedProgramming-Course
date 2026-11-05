// declare led pins
int led1 = 23;
int led2 = 22;
int led3 = 21;
int led4 = 4;

// setup function: run once
void setup(){
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
}

// loop function: run continuously (in loop)
void loop(){
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
  digitalWrite(led4, LOW);
  delay(1000);

  digitalWrite(led1, HIGH);
  digitalWrite(led2 ,HIGH);
  digitalWrite(led3, HIGH);
  digitalWrite(led4, HIGH);
  delay(1000);
}