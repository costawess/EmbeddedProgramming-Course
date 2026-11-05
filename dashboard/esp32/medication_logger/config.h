#pragma once
#include <Arduino.h>

// XIAO ESP32-C3: custom SPI mapping avoids boot-strapping GPIO2/8/9.
constexpr int BUTTON_PIN = 3;       // D1, button to GND
constexpr int SAVED_LED_PIN = 4;    // D2, green LED through 330 ohm to GND
constexpr int STATUS_LED_PIN = 5;   // D3, amber LED through 330 ohm to GND
constexpr int SD_SCK_PIN = 6;       // D4
constexpr int SD_MISO_PIN = 7;      // D5
constexpr int SD_MOSI_PIN = 21;     // D6
constexpr int SD_CS_PIN = 20;       // D7
constexpr uint32_t SD_SPI_HZ = 4000000;
constexpr uint64_t CLOCK_SYNC_MS = 6ULL * 60 * 60 * 1000;
constexpr uint32_t WIFI_TIMEOUT_MS = 30000;
constexpr uint32_t WIFI_RETRY_MS = 60000;
constexpr uint32_t ACK_TIMEOUT_MS = 30000;
constexpr uint32_t DEBOUNCE_MS = 40;
constexpr char MEDICATION_ID[] = "medication"; // letters, numbers, underscore or dash
constexpr char BLE_NAME[] = "Medication-XIAO";
constexpr char SERVICE_UUID[] = "79210001-bca0-4f57-9230-41624b109410";
constexpr char RX_UUID[] = "79210002-bca0-4f57-9230-41624b109410";
constexpr char TX_UUID[] = "79210003-bca0-4f57-9230-41624b109410";

// Copy secrets.example.h to secrets.h. This file is ignored by git.
#if __has_include("secrets.h")
#include "secrets.h"
#else
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define BLE_PAIRING_PIN 654321
#endif
