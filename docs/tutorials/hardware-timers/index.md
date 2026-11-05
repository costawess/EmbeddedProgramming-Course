# ESP32 hardware timer interrupts

Use an ESP32 hardware timer to toggle an LED at a fixed interval without blocking `loop()`.

!!! info "Board package"
    These examples use the **Arduino-ESP32 3.x timer API**. The classic ESP32 has four general-purpose hardware timers; the available number depends on the ESP32 variant.

## Frequency, ticks and interval

A timer counts ticks. The frequency determines how many ticks pass each second, and the alarm value determines how many ticks trigger an interrupt:

$$
T_{\mathrm{alarm}} = \frac{N}{f_{\mathrm{tick}}}
$$

At **10,000 Hz**, an alarm after **20,000 ticks** fires every **2 seconds**. One tick lasts **100 microseconds**. Toggling an LED on every alarm gives a complete on/off cycle every **4 seconds**.

## Configure a hardware timer

```cpp
hw_timer_t *timer = timerBegin(10000);  // 10,000 ticks per second
timerAttachInterrupt(timer, &onTimer);
timerAlarm(timer, 20000, true, 0);      // repeat every 20,000 ticks
```

`timerBegin()` starts the counter after configuration. `timerAlarm()` enables the alarm. Keep the interrupt handler short; perform printing, lengthy calculations, and other slow work in `loop()`.

## Example: toggle an LED every two seconds

```cpp title="timer_blink.ino"
const int LED_PIN = 22;
const uint32_t TIMER_FREQUENCY = 10000;
const uint64_t ALARM_TICKS = 20000;
hw_timer_t *timer = nullptr;

void ARDUINO_ISR_ATTR onTimer() {
  digitalWrite(LED_PIN, !digitalRead(LED_PIN));
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  timer = timerBegin(TIMER_FREQUENCY);
  if (timer == nullptr) {
    Serial.println("Timer allocation failed");
    return;
  }
  timerAttachInterrupt(timer, &onTimer);
  timerAlarm(timer, ALARM_TICKS, true, 0);
}

void loop() {
  // Other non-blocking work can run here.
}
```

Change `LED_PIN` to match your wiring. On the course carrier, GPIO22 controls one of the LEDs.

| Setting | Value | Meaning |
| --- | --- | --- |
| Tick frequency | `10000` | 10,000 ticks per second |
| Alarm value | `20000` | Interrupt after 20,000 ticks |
| Auto-reload | `true` | Repeat the alarm |
| Reload count | `0` | Repeat without a count limit |

## Control the counter

| Function | Purpose |
| --- | --- |
| `timerStop(timer)` | Stop the counter |
| `timerStart(timer)` | Start the counter |
| `timerRestart(timer)` | Restart the counter |
| `timerEnd(timer)` | Release the timer |

## Exercises

### Calculate alarm values

For a tick frequency of **25 kHz**, calculate the number of ticks for alarm intervals of **1 s**, **10 s**, **25 s**, and **25 ms**.

??? success "Check your calculations"
    Use $N = f_{\mathrm{tick}} T_{\mathrm{alarm}}$:

    | Interval | Calculation | Ticks |
    | --- | --- | --- |
    | 1 s | $25,000 \times 1$ | 25,000 |
    | 10 s | $25,000 \times 10$ | 250,000 |
    | 25 s | $25,000 \times 25$ | 625,000 |
    | 25 ms | $25,000 \times 0.025$ | 625 |

### Use two independent timers

Configure two timers to control two LEDs at different intervals. Explain which frequency and alarm value you chose for each. Change one interval and check that the other LED keeps its timing.

[Two-timer sketch](examples/ws5_2_interrupts_timers_2timers/ws5_2_interrupts_timers_2timers.ino){ download }

[Timer visualisation notebook](examples/ws5_2_interrupts_timers_2timers/vis_timers.ipynb){ download }

## More practical sketches

- [BasicTimer](BasicTimer/BasicTimer.ino){ download }
- [0 flicking](examples/0_flicking/0_flicking.ino){ download }
- [1 run blinking function](examples/1_run_blinking_function/1_run_blinking_function.ino){ download }
- [2 add timer interrupt](examples/2_add_timer_interrupt/2_add_timer_interrupt.ino){ download }
- [3 fully timer](examples/3_fully_timer/3_fully_timer.ino){ download }

## Continue learning

- [Timing, interrupts and timers](../../lectures/timing-interrupts.md)
- [Timer start/stop and sawtooth project sketches](../../lectures/timing-interrupts.md#complete-project-sketches)
- [Espressif Arduino-ESP32 Timer API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/timer.html)
