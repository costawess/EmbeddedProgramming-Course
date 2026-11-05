//Embedded Programming

int LED = 22;

int ticks           = 20'000;
int timer_frequency = 10'000;
 
hw_timer_t *My_timer = NULL;        // timer object

void IRAM_ATTR TimerInterrupt()
{
    digitalWrite(LED, !digitalRead(LED));
}

void setup()
{
    pinMode(LED , OUTPUT);
    // initialize timer interrupt
    My_timer = timerBegin(timer_frequency);                     // clock frequency of the timer
    timerAlarm(My_timer , ticks, true, 0);        // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
    timerAttachInterrupt(My_timer, &TimerInterrupt);  // attach interrupt to timer
    timerStart(My_timer);                              // stop tim
}

void loop()
{
    // Do Nothing!
}
