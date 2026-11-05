//Embedded Programming
// declare led pins
int led1 = 23;
int led2 = 22;
int led3 = 21;
int led4 = 4;

// for this please check this page https://costawess.github.io/EmbeddedProgramming-Course/tutorials/tutorial5/ReadMe/#structure-overview
// --------------------------------
// Timer parameters
// --------------------------------
// timer0
int ticks0           = 6'000;
int timer_frequency0 = 10'000;

// timer1
int ticks1           = 2'000;
int timer_frequency1 = 10'000;

// timer2
int ticks2           = 500; // 0.5 s
int timer_frequency2 = 10'000;
// --------------------------------

bool isblinking    = false;
bool isPrintActive = false;

hw_timer_t *My_timer0 = NULL;        // timer0 object
hw_timer_t *My_timer1 = NULL;        // timer1 object
hw_timer_t *My_timer2 = NULL;        // timer2 object

// timer 0
void IRAM_ATTR TimerInterrupt()
{
    isblinking = !isblinking;
}

// timer 1
void IRAM_ATTR BlinkingLEDs()
{
  if(isblinking){
  // change the state
  digitalWrite(led1, !digitalRead(led1));
  digitalWrite(led2, !digitalRead(led2));
  digitalWrite(led3, !digitalRead(led3));
  digitalWrite(led4, !digitalRead(led4));
  }
}

// timer 2
void IRAM_ATTR printSerial_ISR()
{
    isPrintActive = true;
}

// setup function: run once
void setup(){
  Serial.begin(115200); // opens serial port, sets data rate to 9600 bps
  
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
  pinMode(led4, OUTPUT);
    
  // initialize timer interrupt - timer 0
  My_timer0 = timerBegin(timer_frequency0);           // clock frequency of the timer
  timerAlarm(My_timer0 , ticks0, true, 0);            // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
  timerAttachInterrupt(My_timer0, &TimerInterrupt);   // attach interrupt to timer
  timerStart(My_timer0);                              // start timer

  // initialize timer interrupt - timer 1
  My_timer1 = timerBegin(timer_frequency1);           // clock frequency of the timer
  timerAlarm(My_timer1 , ticks1, true, 0);            // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
  timerAttachInterrupt(My_timer1, &BlinkingLEDs);     // attach interrupt to timer
  timerStart(My_timer1);                              // start timer

  // initialize timer interrupt - timer 2 - to print a message every 1/2 second
  My_timer2 = timerBegin(timer_frequency2);           // clock frequency of the timer
  timerAlarm(My_timer2 , ticks2, true, 0);            // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
  timerAttachInterrupt(My_timer2, &printSerial_ISR);  // attach interrupt to timer
  timerStart(My_timer2);                              // start timer
}

// loop function: run continuously (in loop)
void loop(){
  if(isPrintActive){ // only print if triggered isPrintActive==true
    Serial.printf("isblinking = %d \n", isblinking);
    isPrintActive = false;
  }
}