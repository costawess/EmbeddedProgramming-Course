//Example - software interrrupts - code 2
//Embedded Systems semester 1 EMST
//Electrical Engineering
//Wesley Costa (dawe)
//date: 24 september 2025

// set leds pins
const int RED_LED  = 21;
const int BLUE_LED = 23;
const int GREEN_LED = 22;

// Timer object
hw_timer_t* timer1 = nullptr;
hw_timer_t* timer2 = nullptr;

void IRAM_ATTR led_blue_blink() { //places the ISR code in internal RAM (IRAM)
    digitalWrite(BLUE_LED, !digitalRead(BLUE_LED));
}

void IRAM_ATTR led_green_blink() { //places the ISR code in internal RAM (IRAM)
    digitalWrite(GREEN_LED, !digitalRead(GREEN_LED));
}

void setup() {
  // initialize the LED pins as an output
  pinMode(RED_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);

  // default LEDs off
  digitalWrite(RED_LED, LOW);
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(GREEN_LED, LOW);

  // Initialize timer at 1 MHz (1 tick = 1 microssecond)
  timer1 = timerBegin(1'000'000); // clock frequency of the timer
  timer2 = timerBegin(1'000'000); // clock frequency of the timer 1'000

  // Attach ISR
  timerAttachInterrupt(timer1, &led_blue_blink); // attach timer to interrupt
  timerAttachInterrupt(timer2, &led_green_blink); // attach timer to interrupt

  // Turn on alarm every 500000 ticks (500 ms)
  timerAlarm(timer1, 500'000, true, 0);
  timerAlarm(timer2, 450'000, true, 0);
}

void loop() {
  // Blink the red LED
  
  digitalWrite(RED_LED, HIGH); delay(250);
  digitalWrite(RED_LED, LOW);  delay(250);

  // Later, when needed:
  // timerStop(t);       // pause
  // timerStart(t);      // resume
  // timerRestart(t);    // reset counter to 0 and start immediately
}