# Tutorial 10 - Millis()

## Millis()

Example: 

```cpp
const int ledPin = 23;  // Pin connected to LED
unsigned long previousMillis = 0;  // Stores the last time LED was updated
const long interval = 1000;        // Interval (1 second = 1000 ms)

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  unsigned long currentMillis = millis();  // Get current time (ms since start)

  // Check if 1 second has passed
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;  // Save current time
    digitalWrite(ledPin, !digitalRead(ledPin));  // Toggle LED
  }
}

```


