# Variables and data types

## Variables

A variable gives a name and type to a value in memory. Declare it before using it, choose a type that fits the value, and give it an initial value.

```cpp
const int ledPin = 23;
bool buttonPressed = false;
float voltage = 1.65;
```

## Variable Types

This table shows the variable types commonly used in Arduino C, their memory size, and value ranges.  
Note: sizes and ranges depend on the board architecture (8-bit AVR vs 32-bit ESP32/ARM).

| Type (C/Arduino)        | Bytes (AVR 8-bit) | Range (AVR 8-bit)                           | Bytes (ESP32/ARM 32-bit) | Range (ESP32/ARM 32-bit)                           |
|--------------------------|------------------:|---------------------------------------------|-------------------------:|---------------------------------------------------|
| `bool` / `boolean`       | 1                 | `false` / `true`                            | 1                        | `false` / `true`                                  |
| `char` (signed)          | 1                 | −128 to 127                                 | 1                        | −128 to 127                                       |
| `unsigned char` / `byte` | 1                 | 0 to 255                                    | 1                        | 0 to 255                                          |
| `short`                  | 2                 | −32,768 to 32,767                           | 2                        | −32,768 to 32,767                                 |
| `unsigned short`         | 2                 | 0 to 65,535                                 | 2                        | 0 to 65,535                                       |
| `int`                    | 2                 | −32,768 to 32,767                           | 4                        | −2,147,483,648 to 2,147,483,647                   |
| `unsigned int`           | 2                 | 0 to 65,535                                 | 4                        | 0 to 4,294,967,295                                |
| `long`                   | 4                 | −2,147,483,648 to 2,147,483,647             | 4                        | −2,147,483,648 to 2,147,483,647                   |
| `unsigned long`          | 4                 | 0 to 4,294,967,295                          | 4                        | 0 to 4,294,967,295                                |
| `long long`              | 8                 | −9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | 8 | same |
| `unsigned long long`     | 8                 | 0 to 18,446,744,073,709,551,615             | 8                        | same                                              |
| `float`                  | 4                 | ~±3.4×10^38 (≈6–7 digits precision)         | 4                        | ~±3.4×10^38 (≈6–7 digits precision)               |
| `double`                 | 4 *(same as float)* | ~±3.4×10^38 (≈6–7 digits precision)       | 8                        | ~±1.7×10^308 (≈15–16 digits precision)            |
| `size_t`                 | 2                 | 0 to 65,535                                 | 4                        | 0 to 4,294,967,295                                |

---

### Notes

- Ranges assume two’s-complement integers and IEEE-754 floating-point representation.
- On **AVR boards (e.g., Arduino Uno, Nano)**, `double` is the same as `float` (32-bit).
- On **ESP32/ARM boards**, `double` is 64-bit.
- `byte` is simply an alias for `unsigned char`.


### Assigning a value to a variable

Use `=` to assign a new value. A variable declared with `const` cannot be assigned again after initialisation.

```cpp
int counter = 0;
counter = counter + 1;
Serial.println(counter);  // 1
```

#### Exercise

Declare variables for an LED pin, a button state, and a voltage. Choose an appropriate type for each, assign initial values, and print them with `Serial.println()`.


## Continue learning

[Read the related lecture](../../lectures/variables-types.md).

Next: [Conditionals, switch and while loops](../conditionals-loops/index.md).
