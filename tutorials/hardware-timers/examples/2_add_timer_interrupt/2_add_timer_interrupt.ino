//Embedded Programming

// declare led pins
int led1 = 23;
int led2 = 22;
int led3 = 21;
int led4 = 4;

// for this please check this page https://costawess.github.io/EmbeddedProgramming-Course/tutorials/tutorial5/ReadMe/#structure-overview
int ticks           = 40'000;
int timer_frequency = 10'000;

bool isblinking = false;

hw_timer_t *My_timer = NULL;        // timer object

void IRAM_ATTR TimerInterrupt()
{
    isblinking = !isblinking;
}

// setup function: run once
void setup(){
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
    
  // initialize timer interrupt
  My_timer = timerBegin(timer_frequency);                     // clock frequency of the timer
  timerAlarm(My_timer , ticks, true, 0);        // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
  timerAttachInterrupt(My_timer, &TimerInterrupt);  // attach interrupt to timer
  timerStart(My_timer);                              // stop tim
}

// loop function: run continuously (in loop)
void loop(){
  if(isblinking){
    blinking(); // call the function
  }
}

void blinking()
{
  digitalWrite(led1, HIGH);
  digitalWrite(led2 ,HIGH);
  digitalWrite(led3, HIGH);
  digitalWrite(led4, HIGH);
  delay(500);
  
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
  digitalWrite(led4, LOW);
  delay(500);
}