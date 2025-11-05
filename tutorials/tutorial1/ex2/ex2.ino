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
}

void loop()
{
    // Turn the LED on
    digitalWrite(led1, HIGH);
    delay(400);
    digitalWrite(led1, LOW);

    digitalWrite(led2, HIGH);
    delay(400);
    digitalWrite(led2, LOW);

    digitalWrite(led3, HIGH);
    delay(400);
    digitalWrite(led3, LOW);

    digitalWrite(led4, HIGH);
    delay(400);
    digitalWrite(led4, LOW);
}