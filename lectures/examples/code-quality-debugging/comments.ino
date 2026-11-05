// single-line comment: until end of line

/*
  multi-line comment
  for headers and longer explanations
*/

// BAD: repeats the code
i = i + 1;              // add 1 to i

// GOOD: explains the reason
delay(20);   // DHT22 needs 20 ms between reads

// GOOD: units and ranges
const int DRY_LIMIT = 30;   // soil humidity, %
