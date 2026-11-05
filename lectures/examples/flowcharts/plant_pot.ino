const int SENSOR_PIN = 36;     // AD1 terminal (analog)
const int PUMP_PIN   = 26;     // to transistor / relay
const int DRY_LIMIT  = 30;     // percent
int readHumidity() {
  int raw = analogRead(SENSOR_PIN);       // 0..4095
  return map(raw, 4095, 0, 0, 100);       // dry sensor = high raw
}
void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
}
void loop() {
  int humidity = readHumidity();          // read soil humidity
  if (humidity < DRY_LIMIT) {             // humidity < 30 %?
    digitalWrite(PUMP_PIN, HIGH);         // pump on 10 s
    delay(10000);
    digitalWrite(PUMP_PIN, LOW);
    Serial.printf("Humidity %d %% -> watered\n", humidity);
  } else {
    Serial.printf("Humidity %d %% -> soil OK\n", humidity);
  }
  delay(60000);                           // wait 1 minute
}
