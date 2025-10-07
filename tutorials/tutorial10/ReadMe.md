# Tutorial 10 - Setting up the Integrated Development Environment

## Millis()
The millis function is a function that returns the amount of miliseconds that have passed since the board has started running our program.  
This can be useful, for example for timers without blocking code execution, unlike the delay() function, which does block code execution.

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


## Interrupts
Interrupts are used to make the board respond to external (or internal) events immediately, rather than constantly checking for them in the void loop code.

### Hardware Interrupts
Hardware interrupts work based on a given pin number and a signal change, when a button is pressed for example.

Code Example:
```cpp
const int BUTTON_PIN = 34; // One of the buttons on the PCB we use.

bool buttonPressed = false; // Boolean for whether the button is pressed or not

// This trigger function is called when the interrupt happens.
void trigger() {
  // Do something with the trigger here
  buttonPressed = true; // The button was pressed
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP) // Button setup.
  /**
    Here we attach the interrupt, with a given pin, a function

    The digitalPinToInterrupt() function converts a digital pin number to a hardware interrupt.
    
    The second argument, trigger:
    is the function that will be called once the interrupt happens, 
    in an interrupt return types (int, bool etc) are not used, 
    on top of that passing arguments to that function is NOT possible from an interrupt.

    The third argument, FALLING is the mode. This mode can be one of the following:
      - RISING -> The signal goes from LOW to HIGH
      - FALLING -> The signal goes from HIGH to LOW
      - CHANGE -> The signal changed from something to something else
      - LOW -> The signal is LOW, keeps firing the interrupt endlessly while it's signal stays LOW.
  */
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), trigger, FALLING);
}

// A void loop 
void loop() {
  if (buttonPressed == true) {
    Serial.println("The button was pressed!");
    buttonPressed = false; // Reset, the change was handled accordingly.
  }
} 

```

The [arduino docs](https://docs.arduino.cc/language-reference/en/functions/external-interrupts/attachInterrupt/) also have some extensive documentation (with examples) for these interrupts

### Software Interrupts - Timers



