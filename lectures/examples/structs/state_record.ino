enum State { IDLE, HEATING, ALARM };

struct Machine {              // state + data together
  State state = IDLE;
  unsigned long since = 0;    // when the state began
  float setpoint = 21.0;
};

Machine heater;

void enter(Machine &m, State s) {
  m.state = s;
  m.since = millis();
}
