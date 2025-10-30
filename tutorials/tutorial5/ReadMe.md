# Workshop 5 -  Functions, Libraries, Interrupts, Timers

⚠️ This section is still in progress.

## Functions

⚠️ This section is still in progress.


---

## Libraries

⚠️ This section is still in progress.


---

## Interrupts

### Hardware Interrupts

#### What is a Hardware Interrupt?

⚠️ This section is still in progress.


### Software Interrupts - Timers

This tutorial demonstrates how to use **hardware timer interrupts** on the **ESP32** using the Arduino framework.  
Timer interrupts allow you to execute specific code automatically at fixed time intervals, without blocking the main loop.

#### What is a Timer Interrupt?

A timer interrupt is a hardware-based mechanism that triggers a function (called an Interrupt Service Routine – ISR) after a specified time period.  
Unlike using the delay function `delay()`, timers operate independently of your main program flow, allowing for precise timing and non-blocking execution.
The ESP32 has 4 hardware timers per group, allowing multiple independent timing operations.

#### Structure Overview

The general structure for using a timer interrupt on ESP32 is:

```cpp
hw_timer_t *My_timer = NULL;  // timer object

// Initialize timer interrupt
My_timer = timerBegin(0, 80, true);                 // timer index, prescaler, count up
timerAttachInterrupt(My_timer, &onTimer, true);     // attach timer to ISR
timerAlarmWrite(My_timer, 1000000, true);           // set alarm to 1 second (in microseconds)
timerAlarmEnable(My_timer);                         // enable the alarm
```

#### Example

The following code blinks the LED every two seconds.

```cpp
//Embedded Programming

int LED = 22;

int ticks           = 20'000;
int timer_frequency = 10'000;
 
hw_timer_t *My_timer = NULL;        // timer object

void IRAM_ATTR TimerInterrupt()
{
    digitalWrite(LED, !digitalRead(LED)); // The LED state is toggled each time the interrupt occurs.
}

void setup()
{
    pinMode(LED , OUTPUT);
    // initialize timer interrupt
    My_timer = timerBegin(timer_frequency);                     // clock frequency of the timer
    timerAlarm(My_timer , ticks, true, 0);        // timer object name, value to generate interrupt, true = auto reload, number of reloads (0 = infinite)
    timerAttachInterrupt(My_timer, &TimerInterrupt);  // attach interrupt to timer
    timerStart(My_timer);                              // stop tim
}

void loop()
{
    // Do Nothing!
}

```

##### Explanation

- `int ticks = 10000;`: this variable defines the number of ticks (count of the timer clock) before the timer interrupt is triggered. The total time (also called period) before the interrupt occurs is:

\[
T_\text{interrupt} = \frac{\text{ticks}}{\text{\text{timer\_frequency}}} = \frac{20000}{10000} = 2~\text{seconds}
\]

This means that the interrupt occurs every 2 seconds.

- `hw_timer_t *My_timer = NULL;`: Creates a pointer to a hardware timer object. 
That means each tick = 1 / 10,000 = 0.0001 seconds = 100 µs.
- `timerBegin(timer_frequency);`: Initializes the timer (in Hertz). In the example, the argument `timer_frequency` represents the base clock frequency (in this case `timer_frequency` = 10 kHz = 10 thousand ticks per second). 
  - A little bit of math: This means that each tick = 1 / 10,000 = 0.0001 seconds or 100 $\mu$s.
- `timerAttachInterrupt(My_timer, &TimerInterrupt);`: Links the Interrupt Service Routine (ISR) to the timer. Which means that every time the timer reaches the tick count, it calls the function `TimerInterrupt()` (you can change the function as you wish). In the example, the function `TimerInterrupt()` is called every 2 seconds.
- `timerAlarm(My_timer, ticks, true, 0);`: Configures when the timer should trigger an interrupt.

| Parameter | Value in the example | Meaning |
| -- |------------|----------|
|timer object | `My_timer` | The timer object created earlier |
| alarm value | `ticks` | Number of counts before triggering (in the example, 10,000) |
| auto-reload| `true` | Auto-reload enabled (the timer repeats infinitely) |
| reload count | `0` | Number of reloads (0 = infinite) |

- `timerStart(My_timer);`: Starts the timer. 
    - Another timer functions:

| Function | Description |
|-----------|--------------|
| `timerStart(My_timer)` | Starts the timer |
| `timerStop(My_timer)` | Stops the timer |
| `timerRestart(My_timer)` | Restarts the timer |
| `timerAlarmDisable(My_timer)` | Disables the interrupt temporarily |

<details>
<summary>Exercise</summary>

---

1. What should the tick values be for a timer with a frequency of 25kHz and a period ($T_\text{interrupt}$) of:

a) 1 s;
b) 10 s;
c) 25 s;
d) 25 ms;

<details>
<summary>Solution</summary>

a) ticks = $25000\times 1 = 25000$ ticks
b) ticks = $25000\times 10 = 250000$ ticks
c) ticks = $25000\times 25 = 625000$ ticks
d) ticks = $25000\times 25\times 10^{-3} = 25$ ticks

</details>

---

2. Implement a code with two timers. <!-- #TODO complement this -->

<details>
<summary>Solution</summary>

[Code](ws5_2_interrupts_timers_2timers/ws5_2_interrupts_timers_2timers.ino)

</details>

---

</details>

## Next Tutorial

Go to [Workshop 6](../tutorial6/ReadMe.md) - Kitchen Timer.

Back to [main page](../../README.md).