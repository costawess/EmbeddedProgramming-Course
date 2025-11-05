




```cpp

#define LED 21
hw_timer_t *My_timer = NULL;
void IRAM_ATTR onTimer(){
digitalWrite(LED, !digitalRead(LED));
}

void setup() {
pinMode(LED, OUTPUT);
My_timer = timerBegin(0, 80, true);
timerAttachInterrupt(My_timer, &onTimer, true);
timerAlarmWrite(My_timer, 1'000'000, true); // 1'000'000: 
timerAlarmEnable(My_timer); //Just Enable
}

void loop() {
}
```