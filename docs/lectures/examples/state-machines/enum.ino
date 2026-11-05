// magic numbers: what is state 2?
int state = 0;
if (state == 2) { /* ... */ }

// enum: a type with named values
enum State {
  IDLE,       // 0
  RUNNING,    // 1
  ERROR       // 2
};

State currentState = IDLE;
if (currentState == ERROR) { /* ... */ }

Serial.println(currentState);   // prints 0
