# Workshop 4 - UART and ADC

![](20250918090718.png)

## OUTPUT

## INPUT

### Example: User inputs Through UART comm

```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("Enter a number and press Enter:");
}

void loop() {
  if (Serial.available() > 0) { // only starts if the serial communication is active
    int value = Serial.parseInt();   // read an integer number from serial
    Serial.print("You entered: ");
    Serial.println(value);

    if (value > 5) {
      Serial.println("The entered value is greater than 5");
    } else if (value < 5) {
      Serial.println("The entered value is less than 5");
    } else {
      Serial.println("The entered value is equal to 5");
    }
    Serial.println("\nEnter another number:");
  }
}
```

## Next Tutorial

Go to [Workshop 5](../tutorial4/ReadMe.md) - Functions, Libraries, Interrupts, Timers.
