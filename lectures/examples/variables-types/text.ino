double pi = 3.14159;
float volts = 3.3 * (1564 / 4095.0);   // 1.26 V

char letter = 'A';      // stored as 65
char next = letter + 1; // 'B'
char digit = '0' + 7;   // '7'

String name = "ESP32";
String msg = "Hello, World!";
Serial.println(msg + " from " + name);
Serial.println(name.length());     // 5
Serial.println(volts, 3);          // 1.260
