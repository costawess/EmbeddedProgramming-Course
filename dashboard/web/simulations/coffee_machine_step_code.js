window.COFFEE_STEP_CODE = String.raw`/* Coffee Machine - Step by Step*/

// Button pins
const int BUTTON_START_PIN = 34;
const int BUTTON_END_PIN = 35;

// LED pins
const int RED_PIN   = 21;
const int GREEN_PIN = 22;

bool brewRequested = false;
bool cupRemoved = false;
bool running = false;

int state; // 0: idle, 1: brewing, 2: finished

int counter = 0;

// Timer variables
hw_timer_t *timer = NULL;

void IRAM_ATTR brewStart() {
  if (!running) {
    brewRequested = true;
  }
}

void IRAM_ATTR removeCup() {
  if (!running) {
    cupRemoved = true;
  }
}

void IRAM_ATTR onTimer() {
  counter++;
}

void lightLEDs(bool green_state, bool red_state) {
  digitalWrite(GREEN_PIN, green_state ? HIGH : LOW);
  digitalWrite(RED_PIN, red_state ? HIGH : LOW);
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);

  // Initialize LED pins
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);

  // Initialize the button pins
  pinMode(BUTTON_START_PIN, INPUT);
  pinMode(BUTTON_END_PIN, INPUT);

  // Attach the button interrupt
  attachInterrupt(digitalPinToInterrupt(BUTTON_START_PIN), brewStart, RISING);
  attachInterrupt(digitalPinToInterrupt(BUTTON_END_PIN), removeCup, RISING);

  // Initialize the timer
  timer = timerBegin(1000000); // parameters: timer frequency in Hz
  timerAttachInterrupt(timer, &onTimer); // parameters: timer, ISR function
  timerAlarm(timer, 500000, true, 0); // parameters: timer, alarm value, auto-reload, edge

  // Set the initial state
  state = 0;
  lightLEDs(LOW, HIGH);
}

void loop() {
  Serial.printf("State = %d\n", state);

  if(state == 0){
    if(brewRequested){
      lightLEDs(HIGH, LOW);
      running = true;

      // next state
      state = 1;

      // Reset the brew request and blink count
      brewRequested = false;
      counter = 0;
    }
  } else if(state ==1){
      if (counter<6){
        // blink the green LED
        if (counter % 2 == 0) {
          lightLEDs(LOW, LOW);
        } else {
          lightLEDs(HIGH, LOW);
        }
      } else {
        // Brewing finished
        lightLEDs(HIGH, LOW);
        running = false;

        // next state
        state = 2;

        // reset the counter
        counter = 0;

      }
  } else if(state == 2){
    // Wait for the user to press the button again to reset
    if(cupRemoved){
      // Reset the state
      state = 0;
      lightLEDs(LOW, HIGH);

      brewRequested = false;
      cupRemoved = false;
      counter = 0;
    }
  }
}`;
