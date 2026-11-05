---
title: "Projects and Best Practices"
---

# Projects and Best Practices

## Debugging toolbox

**Tools**

- **Serial Monitor / Plotter** for values and signals.

- *Tools $\rightarrow$ Core Debug Level*: enables `log_i()`, `log_e()` …

- `esp_reset_reason()`: why did the board reboot?

- `ESP.getFreeHeap()`: detect memory leaks.

- Backtraces: decode with the *ESP Exception Decoder*.

**Common messages**  

<div class="tabular">

@L3.0cm L3.2cm@ **Message** & **Likely cause**  
`Guru Meditation Error` & null pointer, stack overflow  
`Brownout detector was triggered` & weak USB cable / supply  
`Task watchdog got triggered` & `loop()` blocked too long  
`Timed out waiting for packet header` & not in download mode  

</div>

## Best practices checklist

!!! info "Hardware"
    
    - 3.3 V only on GPIO
    
    - Avoid GPIO 6–11
    
    - Mind strapping pins
    
    - Drivers for loads $>$ 12 mA
    
    - Common ground


!!! tip "Software"
    
    - No long `delay()`
    
    - Short ISRs + flags
    
    - ADC1 when Wi-Fi is on
    
    - Reconnect logic for Wi-Fi / MQTT
    
    - Check return values


!!! note "Engineering"
    
    - Code in Git
    
    - Secrets out of the repo
    
    - Name pins with `const`
    
    - Test step by step
    
    - Read the datasheet


## Cheat sheet: the Arduino functions of this course

**Digital**  
`pinMode(pin, mode)`  
`digitalWrite(pin, v)`  
`digitalRead(pin)`  
**Analog**  
`analogRead(pin)`  
`analogReadMilliVolts(pin)`  
`ledcAttach(pin, f, bits)`  
`ledcWrite(pin, duty)`  
`dacWrite(25, v)`  
`map()`, `constrain()`

**Time**  
`millis()`, `micros()`  
`delay(ms)`  
`attachInterrupt(\dots)`  
`timerBegin(f)`  
`timerAttachInterrupt(t, fn)`  
`timerAlarm(t, n, true, 0)`  
`Ticker.attach(s, fn)`  
**Serial**  
`Serial.begin(115200)`  
`print()`, `printf()`  
`available()`, `readStringUntil()`

**Buses**  
`Wire.begin(19, 18)`  
`beginTransmission(a)`  
`write(b)`, `endTransmission()`  
`requestFrom(a, n)`, `read()`  
`SPI.begin()`, `SPI.transfer(b)`  
`Serial2.begin(115200, SERIAL_8N1, 16, 17);`  
**Structure**  
`enum`, `switch / case`  
`const`, `volatile`, `static`  
`IRAM_ATTR`

## Lab challenges across the whole course

[Try simulation: Tic-tac-toe](https://costawess.github.io/Programming-Dashboard/web/experiments/tic_tac_toe.html){ .md-button .lecture-simulation }

<div class="tabular">

c L11.8cm **Level** & **Challenge**  
& Traffic light on the course board with realistic timing; print each phase on Serial.  
& Battery indicator: pot $\rightarrow$ 4-LED bar graph with a function and an array; PWM dimmer.  
& Reaction-time game with interrupts, `millis()` and a random start delay; detect cheating.  
& Weather station: BME280 + OLED on the I<sup>2</sup>C header; log CSV data on UART2.  
& Pedestrian crossing or coffee machine as a state machine, no `delay()` anywhere.  
& Connected plant pot: humidity, pump, MQTT reports, deep sleep between measurements.  

</div>

!!! tip "Deliverable (every assignment)"
    
    Analysis, requirements, flowchart or state diagram, code, evaluation (tests against the requirements), photo or video of the working setup.


## Advice for the future

- You have learned the **fundamentals** of embedded programming.

- You do not need to know every function, library or register by heart: understand the **underlying concepts**.

- Break a complex problem into **smaller parts**.

- Start small, build something that works, then improve it.

- Write code that you can **explain**.

- **Test one thing at a time.**

!!! info "The most important skill"
    
    Not writing code that works the first time, but understanding **why** something does not work and knowing how to investigate it.


!!! tip "Do it yourself!"
    
    Some students are more experienced. At some point you will be alone and have to figure it out on your own: practise that now. Build projects that interest you.


!!! warning "Versioning"
    
    *final, finalv2, reallyreadyfordemo*: use Git, especially when you code together.


*Sources: Lecture 6 [Embedded Programming, lectures 1–6](references.md#ep-lectures)*

## Where to go next

**Programming**

- bitwise operations

- pointers and dynamic memory

- classes (C++)

- version control (Git)

**Hardware and control**

- PWM and motor control

- PID control

- line-following robots

- battery management

- CAN bus and automotive communication

**Connectivity**

- Bluetooth

- Wi-Fi and web interfaces

- sending sensor data to a cloud platform

- OTA firmware updates

!!! info "Info"
    
    Several of these topics are already in the *Going further* chapters of these slides: try them in your projects.


*Sources: Lecture 6 [Embedded Programming, lectures 1–6](references.md#ep-lectures)*

## Summary

- From a **client story** to requirements, a flowchart and code.

- C/C++ basics: variables and types, functions, `if`, loops, arrays.

- The ESP32: dual core, 3.3 V, Wi-Fi/BT; <span class="alert">GPIO 6–11 forbidden</span>, **34–39 input only**, strapping pins 0/2/5/12/15.

- Digital and analog I/O, PWM, DAC on the course board.

<!-- -->

- Time without blocking: `millis()`, interrupts, timers.

- Communication: UART, I<sup>2</sup>C, SPI, libraries; check it with a logic analyzer.

- Structure: state machines with `enum` and `switch`.

- Debug systematically; keep your code clean and under version control.

!!! tip "Tip"
    
    Always check the **datasheet**, the **schematic of your board** and the **core version** of examples you find online.


## Further material: projects

### Read

- [Course repository (GitHub)](https://github.com/costawess/EmbeddedProgramming-Course)

- [Arduino-ESP32 documentation](https://docs.espressif.com/projects/arduino-esp32/en/latest/)

- [Random Nerd Tutorials: ESP32 projects](https://randomnerdtutorials.com/getting-started-with-esp32/)

### Watch

- [YouTube: ESP32 project ideas](https://www.youtube.com/results?search_query=esp32+project+ideas)

### Try it

- [Course dashboard: all simulations and experiments](https://costawess.github.io/Programming-Dashboard/web/index.html)

- [Experiment: tic-tac-toe](https://costawess.github.io/Programming-Dashboard/web/experiments/tic_tac_toe.html)

- [Wokwi: ESP32 simulator](https://wokwi.com/projects/new/esp32)
