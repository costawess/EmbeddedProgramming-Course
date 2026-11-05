enum State { NORMAL, ORANGE, PED_GREEN, ALL_RED };
State state = NORMAL;

void loop() {
  switch (state) {
    case NORMAL:    /* ... */ break;
    case ORANGE:    /* ... */ break;
    case PED_GREEN: /* ... */ break;
    case ALL_RED:   /* ... */ break;
    default:
      Serial.println("INVALID STATE");
      state = ALL_RED;      // go to a safe state
      break;
  }
}
