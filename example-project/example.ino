#include <Wire.h>
#include "ScioSense_ENS160.h"   // ENS160 driver
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"

// ------------------------- Pin Definitions -------------------------
const uint8_t SHARP_LED_PIN = 12;   // Sharp Dust/particle sensor Led Pin
const uint8_t SHARP_VO_PIN  = 34;   // Sharp Dust/particle analog out pin used for reading

// ------------------------- Sensor Objects -------------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1); // ENS160 at 0x53
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);
Adafruit_SHT31 sht31 = Adafruit_SHT31();

bool enableHeater = false;
uint8_t loopCnt = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  // ---------------- ENS160 Init ----------------
  Serial.print("ENS160...");
  ens160.begin();
  Serial.println(ens160.available() ? "done." : "failed!");

  if (ens160.available()) {
    Serial.print("\tRev: ");
    Serial.print(ens160.getMajorRev());
    Serial.print(".");
    Serial.print(ens160.getMinorRev());
    Serial.print(".");
    Serial.println(ens160.getBuild());

    Serial.print("\tStandard mode ");
    Serial.println(ens160.setMode(ENS160_OPMODE_STD) ? "done." : "failed!");
  }

  // ---------------- Dust Sensor Init ----------------
  dustSensor.begin();

  // ---------------- SHT31 Init ----------------
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31, cek wiring SDA/SCL!");
    while (1) delay(1);
  }
  Serial.print("Heater Enabled State: ");
  Serial.println(sht31.isHeaterEnabled() ? "ENABLED" : "DISABLED");
}

void loop() {
  // ---------------- Read SHT31 ----------------
  float t = sht31.readTemperature();
  float h = sht31.readHumidity();

  if (!isnan(t) && !isnan(h)) {
    Serial.print("Temp *C = "); Serial.print(t); Serial.print("\t");
    Serial.print("Hum. % = "); Serial.println(h);

    // Kirim data suhu & RH ke ENS160 untuk kompensasi
    // API: ens160.set_envdata(uint16_t rh, int16_t temp)
    // Format: RH dalam 0.01% (x100), Temp dalam 0.01°C (x100)
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
  } else {
    Serial.println("Failed to read SHT31");
  }

  // ---------------- ENS160 ----------------
  if (ens160.available()) {
    ens160.measure(true);
    ens160.measureRaw(true);

    Serial.print("  AQI: "); Serial.print(ens160.getAQI());
    Serial.print("  TVOC: "); Serial.print(ens160.getTVOC()); Serial.print(" ppb  ");
    Serial.print("eCO2: "); Serial.print(ens160.geteCO2()); Serial.print(" ppm\t");

    Serial.print("R HP0: "); Serial.print(ens160.getHP0()); Serial.print(" Ohm\t");
    Serial.print("R HP1: "); Serial.print(ens160.getHP1()); Serial.print(" Ohm\t");
    Serial.print("R HP2: "); Serial.print(ens160.getHP2()); Serial.print(" Ohm\t");
    Serial.print("R HP3: "); Serial.print(ens160.getHP3()); Serial.println(" Ohm");
  }

  // ---------------- Dust Sensor ----------------
  Serial.print("Dust density: ");
  Serial.print(dustSensor.getDustDensity());
  Serial.print(" ug/m3; Running average: ");
  Serial.print(dustSensor.getRunningAverage());
  Serial.println(" ug/m3");

  delay(1000);

  // ---------------- Heater Toggle ----------------
  if (loopCnt >= 30) {
    enableHeater = !enableHeater;
    sht31.heater(enableHeater);
    Serial.print("Heater Enabled State: ");
    Serial.println(sht31.isHeaterEnabled() ? "ENABLED" : "DISABLED");
    loopCnt = 0;
  }
  loopCnt++;
}
