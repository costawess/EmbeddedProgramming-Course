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
