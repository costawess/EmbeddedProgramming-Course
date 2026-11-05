// Telemetry scaffold, NOT a completed traffic-light assignment.
// Implement GPIO outputs, a hardware button interrupt and a timer interrupt.
// Publish the actual applied output combination, not only the requested state.
// Do not print from an ISR. Use flags/counters and process them in loop().
enum Lamp { RED, YELLOW, GREEN };
Lamp carLamp = GREEN;
Lamp pedestrianLamp = RED;
bool buttonPressed = false;
unsigned long lastTelemetryMs = 0;
bool telemetryChanged = true;

const char* lampName(Lamp lamp) {
  switch (lamp) {
    case RED: return "r";
    case YELLOW: return "y";
    case GREEN: return "g";
  }
  return "INVALID";
}

// Call from loop() after applying a new combination to the real GPIOs.
// Keep these telemetry fields owned by loop(); ISR code only raises flags.
void reportAppliedOutputs(Lamp car, Lamp pedestrian) {
  if (car != carLamp || pedestrian != pedestrianLamp) {
    carLamp = car;
    pedestrianLamp = pedestrian;
    telemetryChanged = true;
  }
}

void sendTelemetry() {
  const unsigned long now = millis();
  if (!telemetryChanged && now - lastTelemetryMs < 50) return;
  lastTelemetryMs = now;
  telemetryChanged = false;
  Serial.print("Car:");
  Serial.print(lampName(carLamp));
  Serial.print(" Pedestrian:");
  Serial.print(lampName(pedestrianLamp));
  Serial.print(" Button:");
  Serial.println(buttonPressed ? 1 : 0);
}

void setup() {
  Serial.begin(115200);
  // TODO: configure lamp GPIOs and apply GREEN / RED.
  // TODO: configure button GPIO and attach its hardware interrupt.
  // TODO: configure timer interrupt for the assignment timings.
}

void loop() {
  // TODO: safely consume flags/counters set by your ISRs.
  // TODO: update buttonPressed from the actual button level.
  // TODO: apply outputs, then call reportAppliedOutputs(car, pedestrian).
  // Sequence: GREEN/RED -> YELLOW/RED (500 ms) -> RED/GREEN (4000 ms)
  //           -> RED/RED -> GREEN/RED. Both-red duration is unspecified.
  // Never allow GREEN/GREEN. Do not use delay() to control this sequence.
  sendTelemetry();
}
