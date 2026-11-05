---
title: "Going Further: Storage, Low Power and OTA"
---

# Going Further: Storage, Low Power and OTA

## Persistent storage with Preferences (NVS)

```cpp title="boot_counter.ino"
#include <Preferences.h>
Preferences prefs;

void setup() {
  Serial.begin(115200);
  prefs.begin("lab", false);                  // namespace, read/write
  uint32_t boots = prefs.getUInt("boots", 0); // default 0
  prefs.putUInt("boots", ++boots);
  prefs.end();
  Serial.printf("This board booted %lu times\n",
                (unsigned long) boots);
}

void loop() {}
```

[Download this example](examples/storage-low-power-ota/boot_counter.ino){ download }

- Key/value pairs in the **nvs** flash partition: survive reset and power loss.

- Types: int, float, bool, String, byte arrays.

- Use for calibration data, settings, Wi-Fi credentials.

!!! tip "Flash wear"
    
    Flash has $\approx$ 100 k erase cycles: do not write every loop iteration.


## Why low power matters

- A battery stores charge in mAh: 2000 mAh = 2000 mA for 1 hour, or 1 mA for 2000 hours.

- Average current decides the lifetime:  
  $\displaystyle I_{avg} = \frac{I_{on} \cdot t_{on} + I_{sleep} \cdot t_{sleep}}{t_{on} + t_{sleep}}$

- Always awake with Wi-Fi ($\approx$ 100 mA): $\approx$ 20 hours.

- Mostly in deep sleep: months to years.

!!! info "Strategy"
    
    1.  Wake up (timer or button).
    
    2.  Measure quickly.
    
    3.  Send the data.
    
    4.  Go back to deep sleep.


!!! tip "Also"
    
    Lower the CPU clock (`setCpuFrequencyMhz(80)`), switch off Wi-Fi when not needed, remove power LEDs on the final hardware.


*Sources: [ESP-IDF Programming Guide: Sleep Modes (ESP32)](references.md#esp-idf-sleep)*

## Deep sleep: running for months on a battery

```cpp title="deep_sleep.ino"
#define SLEEP_SECONDS 10
RTC_DATA_ATTR int bootCount = 0;     // lives in RTC memory

void setup() {
  Serial.begin(115200);
  bootCount++;
  esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
  Serial.printf("Boot #%d, wake cause %d\n", bootCount, (int) cause);

  /* ... read sensor, send data ... */

  esp_sleep_enable_timer_wakeup(SLEEP_SECONDS * 1000000ULL);
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 1); // button to 3V3
  Serial.flush();
  esp_deep_sleep_start();             // never returns
}

void loop() {}                        // never reached
```

[Download this example](examples/storage-low-power-ota/deep_sleep.ino){ download }

- Wake-up = **full reset**: `setup()` runs again.

- Only `RTC_DATA_ATTR` variables survive.

- ext0 / ext1 wake-up only on **RTC GPIOs** (0, 2, 4, 12–15, 25–27, 32–39).

!!! info "Budget example"
    
    2 s @ 100 mA every 10 min + 10 μA sleep $\Rightarrow$ $\approx$ 0.34 mA avg. $\Rightarrow$ $\approx$ 8 months on 2000 mAh (bare module; a DevKit draws mA while asleep).


*Sources: [ESP-IDF Programming Guide: Sleep Modes (ESP32)](references.md#esp-idf-sleep)*

## Over-the-air (OTA) updates

```cpp title="ota.ino"
#include <WiFi.h>
#include <ArduinoOTA.h>

void setup() {
  /* ... connect to Wi-Fi ... */
  ArduinoOTA.setHostname("esp32-lab-01");
  ArduinoOTA.setPassword("change-me");
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();     // keep loop non-blocking
  /* ... application code ... */
}
```

[Download this example](examples/storage-low-power-ota/ota.ino){ download }

1.  Upload this sketch once over USB.

2.  The board appears as a **network port** in *Tools $\rightarrow$ Port*.

3.  Next uploads go over Wi-Fi into the idle **app** slot.

!!! warning "Every new sketch must include OTA"
    
    otherwise the next update needs USB again. Protect it with a password.


## Exercises: storage, low power and OTA

!!! example "Exercise 1 – Remember settings"
    
    Store the blink interval in NVS; change it with a Serial command; it must survive a reset.


!!! example "Exercise 2 – Battery node"
    
    Wake up every 30 s, read the BME280, print the values, count the boots in RTC memory, and go back to sleep. Estimate the battery lifetime on 2000 mAh.


!!! example "Exercise 3 – OTA"
    
    Add OTA to your web-server project and update it over Wi-Fi. What happens if the new sketch has no OTA code?


## Further material: storage, low power and OTA

### Read

- [Arduino-ESP32 Preferences API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/preferences.html)

- [Arduino-ESP32 Deep Sleep API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/deepsleep.html)

- [ESP-IDF sleep modes](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/sleep_modes.html)

### Watch

- [YouTube: ESP32 deep sleep](https://www.youtube.com/results?search_query=esp32+deep+sleep+arduino+ide)

- [YouTube: ESP32 OTA](https://www.youtube.com/results?search_query=esp32+arduino+ota+update)

### Try it

- [Battery life calculator (Digi-Key)](https://www.digikey.com/en/resources/conversion-calculators/conversion-calculator-battery-life)
