// Turn on an LED using ESP32

// Define the pins where the LEDs are connected
const int led1 = 21;
const int led2 = 22;
const int led3 = 23;
const int led4 = 4;

void setup()
{
    // Initialize the LED pin as an output
    pinMode(led1, OUTPUT);
    pinMode(led2, OUTPUT);
    pinMode(led3, OUTPUT);
    pinMode(led4, OUTPUT);

    // Turn the LED on
    digitalWrite(led1, HIGH);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, HIGH);
    digitalWrite(led4, HIGH);
}

void loop()
{
    // Nothing else to do in the loop since the LED remains on
}