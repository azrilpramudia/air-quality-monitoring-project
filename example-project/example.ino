#include <Wire.h>
#include "ScioSense_ENS160.h"
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"
#include <TFT_eSPI.h>
#include <SPI.h>
// ------------------------- TFT -------------------------
TFT_eSPI tft = TFT_eSPI();

// ------------------------- Pin Definitions -------------------------
const uint8_t SHARP_LED_PIN = 12;
const uint8_t SHARP_VO_PIN  = 34;

// ------------------------- Sensor Objects -------------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);
Adafruit_SHT31 sht31 = Adafruit_SHT31();

void setup() {
  Serial.begin(115200);

  // TFT init
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(0, 0);
  tft.println("Init...");

  // ENS160 init
  ens160.begin();
  if (ens160.available()) {
    ens160.setMode(ENS160_OPMODE_STD);
  }

  // Dust sensor init
  dustSensor.begin();

  // SHT31 init
  if (!sht31.begin(0x44)) {
    tft.println("SHT31 FAIL!");
    while (1) delay(1);
  }
}

void loop() {
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(0, 0);

  // --- SHT31 ---
  float t = sht31.readTemperature();
  float h = sht31.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    tft.printf("Temp: %.2f C\n", t);
    tft.printf("Hum : %.2f %%\n", h);
  } else {
    tft.println("SHT31 Error");
  }

  // --- ENS160 ---
  if (ens160.available()) {
    ens160.measure(true);
    ens160.measureRaw(true);

    int aqi  = ens160.getAQI();
    int tvoc = ens160.getTVOC();
    int eco2 = ens160.geteCO2();

    tft.printf("AQI : %d\n", aqi);
    tft.printf("TVOC: %d ppb\n", tvoc);
    tft.printf("eCO2: %d ppm\n", eco2);
  }

  // --- Dust Sensor ---
  float dust = dustSensor.getDustDensity();
  float avg  = dustSensor.getRunningAverage();
  tft.printf("Dust: %.2f ug/m3\n", dust);
  tft.printf("Avg : %.2f ug/m3\n", avg);

  delay(1000);
}
