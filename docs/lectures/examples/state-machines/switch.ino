switch (currentState) {
  case IDLE:
    Serial.println("System idle");
    break;
  case RUNNING:
    Serial.println("System running");
    break;
  case ERROR:
    Serial.println("System error");
    break;
  default:
    Serial.println("INVALID STATE");
    break;
}
