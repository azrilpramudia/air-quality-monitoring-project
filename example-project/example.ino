#include <Wire.h>
#include <Adafruit_AHTX0.h>    // https://github.com/adafruit/Adafruit_AHTX0
#include "ScioSense_ENS160.h"  // https://github.com/adafruit/ENS160_driver
#include <GP2YDustSensor.h>

const uint8_t SHARP_LED_PIN = 14;   // Sharp Dust/particle sensor Led Pin
const uint8_t SHARP_VO_PIN  = 32;   // Sharp Dust/particle analog out pin used for reading

// ------------------------- Sensor Instances ------------------------
Adafruit_AHTX0 aht;
ScioSense_ENS160 ens160(ENS160_I2CADDR_1); // ENS160 at 0x53 (AHT21 + ENS160 combo)
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);

// ------------------------- Global Variables ------------------------
int tempC;      // Temperature in Celsius
int humidity;   // Relative Humidity

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  pinMode(ArduinoLED, OUTPUT);
  digitalWrite(ArduinoLED, LOW);

  Serial.print("ENS160...");
  ens160.begin();
  Serial.println(ens160.available() ? "done." : "failed!");
  if (ens160.available()) {
    // Print ENS160 version info
    Serial.print("\tRev: ");
    Serial.print(ens160.getMajorRev());
    Serial.print(".");
    Serial.print(ens160.getMinorRev());
    Serial.print(".");
    Serial.println(ens160.getBuild());

    Serial.print("\tStandard mode ");
    Serial.println(ens160.setMode(ENS160_OPMODE_STD) ? "done." : "failed!");
  }

  Serial.println("Adafruit AHT10/AHT20 demo!");
  if (!aht.begin()) {
    Serial.println("Could not find AHT? Check wiring");
    while (1) delay(10);
  }
  Serial.println("AHT10 or AHT20 found");


  dustSensor.begin();
}

void loop() {
  if (ens160.available()) {
    ens160.set_envdata(tempC, humidity);
    ens160.measure(true);
    ens160.measureRaw(true);

    Serial.print("  AQI: ");
    Serial.print(ens160.getAQI());
    Serial.print("  ");

    Serial.print("TVOC: ");
    Serial.print(ens160.getTVOC());
    Serial.print("ppb  ");

    Serial.print("eCO2: ");
    Serial.print(ens160.geteCO2());
    Serial.print("ppm\t");

    // below to read raw resistance values
    Serial.print("R HP0: "); Serial.print(ens160.getHP0()); Serial.print(" Ohm\t");
    Serial.print("R HP1: "); Serial.print(ens160.getHP1()); Serial.print(" Ohm\t");
    Serial.print("R HP2: "); Serial.print(ens160.getHP2()); Serial.print(" Ohm\t");
    Serial.print("R HP3: "); Serial.print(ens160.getHP3()); Serial.println(" Ohm");

    sensors_event_t humidity1, temp;
    aht.getEvent(&humidity1, &temp); // Populate temp and humidity objects with fresh data
    tempC = (temp.temperature);
    humidity = (humidity1.relative_humidity);

    Serial.print("Temp: ");
    Serial.print(tempC);
    Serial.print("  Humidity: ");
    Serial.println(humidity);
  }

  Serial.print("Dust density: ");
  Serial.print(dustSensor.getDustDensity());
  Serial.print(" ug/m3; Running average: ");
  Serial.print(dustSensor.getRunningAverage());
  Serial.println(" ug/m3");

  delay(1000);
}
