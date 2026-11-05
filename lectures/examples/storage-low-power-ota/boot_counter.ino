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
