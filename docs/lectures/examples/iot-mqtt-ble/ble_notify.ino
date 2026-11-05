#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"
BLECharacteristic *ch;
void setup() {
  BLEDevice::init("ESP32-Hanze");
  BLEServer  *server = BLEDevice::createServer();
  BLEService *svc    = server->createService(SERVICE_UUID);
  ch = svc->createCharacteristic(CHAR_UUID,
         BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  ch->addDescriptor(new BLE2902());     // lets clients enable notify
  svc->start();
  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
}
void loop() {
  int value = analogRead(34);
  ch->setValue(value);
  ch->notify();                         // push to connected phone
  delay(1000);
}
