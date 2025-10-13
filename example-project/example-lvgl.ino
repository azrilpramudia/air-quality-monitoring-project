#include <Wire.h>
#include "ScioSense_ENS160.h"
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"
#include <TFT_eSPI.h>
#include <SPI.h>
#include <lvgl.h>

// ------------------------- TFT -------------------------
TFT_eSPI tft = TFT_eSPI();
lv_disp_draw_buf_t draw_buf;
lv_color_t buf[240 * 10]; // buffer baris

// ------------------------- Pin Definitions -------------------------
const uint8_t SHARP_LED_PIN = 12;
const uint8_t SHARP_VO_PIN  = 34;

// ------------------------- Sensor Objects -------------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);
Adafruit_SHT31 sht31 = Adafruit_SHT31();

// ------------------------- LVGL Objects -------------------------
lv_obj_t *labelTemp, *labelHum, *labelAQI, *labelDust, *labelTVOC, *labelECO2;

// ------------------------- LVGL Flush Callback -------------------------
void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
  tft.startWrite();
  tft.setAddrWindow(area->x1, area->y1,
                    area->x2 - area->x1 + 1,
                    area->y2 - area->y1 + 1);
  tft.pushColors((uint16_t *)&color_p->full,
                 (area->x2 - area->x1 + 1) * (area->y2 - area->y1 + 1),
                 true);
  tft.endWrite();
  lv_disp_flush_ready(disp);
}

void setup() {
  Serial.begin(115200);

  // TFT init
  tft.init();
  tft.setRotation(1);

  // LVGL init
  lv_init();
  lv_disp_draw_buf_init(&draw_buf, buf, NULL, 240 * 10);

  static lv_disp_drv_t disp_drv;
  lv_disp_drv_init(&disp_drv);
  disp_drv.hor_res = 320;
  disp_drv.ver_res = 240;
  disp_drv.flush_cb = my_disp_flush;
  disp_drv.draw_buf = &draw_buf;
  lv_disp_drv_register(&disp_drv);

  // ------------------------- UI Design -------------------------
  // Style untuk card
  static lv_style_t style_card;
  lv_style_init(&style_card);
  lv_style_set_radius(&style_card, 10);
  lv_style_set_pad_all(&style_card, 8);
  lv_style_set_bg_opa(&style_card, LV_OPA_COVER);
  lv_style_set_text_color(&style_card, lv_color_white());

  // Card Suhu & Humidity
  lv_obj_t *card1 = lv_obj_create(lv_scr_act());
  lv_obj_add_style(card1, &style_card, 0);
  lv_obj_set_size(card1, 150, 100);
  lv_obj_align(card1, LV_ALIGN_TOP_LEFT, 5, 5);
  lv_obj_set_style_bg_color(card1, lv_color_hex(0x2196F3), 0); // biru

  labelTemp = lv_label_create(card1);
  lv_label_set_text(labelTemp, "Temp: --.- C");
  lv_obj_align(labelTemp, LV_ALIGN_TOP_MID, 0, 0);

  labelHum = lv_label_create(card1);
  lv_label_set_text(labelHum, "Hum : --.- %");
  lv_obj_align(labelHum, LV_ALIGN_BOTTOM_MID, 0, 0);

  // Card AQI
  lv_obj_t *card2 = lv_obj_create(lv_scr_act());
  lv_obj_add_style(card2, &style_card, 0);
  lv_obj_set_size(card2, 150, 100);
  lv_obj_align(card2, LV_ALIGN_TOP_RIGHT, -5, 5);
  lv_obj_set_style_bg_color(card2, lv_color_hex(0x4CAF50), 0); // hijau

  labelAQI = lv_label_create(card2);
  lv_label_set_text(labelAQI, "AQI: --\nGOOD");
  lv_obj_center(labelAQI);

  // Card Dust
  lv_obj_t *card3 = lv_obj_create(lv_scr_act());
  lv_obj_add_style(card3, &style_card, 0);
  lv_obj_set_size(card3, 100, 100);
  lv_obj_align(card3, LV_ALIGN_BOTTOM_LEFT, 5, -5);
  lv_obj_set_style_bg_color(card3, lv_color_hex(0x9E9E9E), 0); // abu-abu

  labelDust = lv_label_create(card3);
  lv_label_set_text(labelDust, "Dust:\n-- ug/m3");
  lv_obj_center(labelDust);

  // Card TVOC
  lv_obj_t *card4 = lv_obj_create(lv_scr_act());
  lv_obj_add_style(card4, &style_card, 0);
  lv_obj_set_size(card4, 100, 100);
  lv_obj_align(card4, LV_ALIGN_BOTTOM_MID, 0, -5);
  lv_obj_set_style_bg_color(card4, lv_color_hex(0x009688), 0); // teal

  labelTVOC = lv_label_create(card4);
  lv_label_set_text(labelTVOC, "TVOC:\n-- ppb");
  lv_obj_center(labelTVOC);

  // Card eCO2
  lv_obj_t *card5 = lv_obj_create(lv_scr_act());
  lv_obj_add_style(card5, &style_card, 0);
  lv_obj_set_size(card5, 100, 100);
  lv_obj_align(card5, LV_ALIGN_BOTTOM_RIGHT, -5, -5);
  lv_obj_set_style_bg_color(card5, lv_color_hex(0xFF9800), 0); // oranye

  labelECO2 = lv_label_create(card5);
  lv_label_set_text(labelECO2, "eCO2:\n-- ppm");
  lv_obj_center(labelECO2);

  // ------------------------- Sensor Init -------------------------
  ens160.begin();
  if (ens160.available()) {
    ens160.setMode(ENS160_OPMODE_STD);
  }
  dustSensor.begin();
  sht31.begin(0x44);
}

void loop() {
  // --- SHT31 ---
  float t = sht31.readTemperature();
  float h = sht31.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    lv_label_set_text_fmt(labelTemp, "Temp: %.1f C", t);
    lv_label_set_text_fmt(labelHum, "Hum : %.1f %%", h);
  }

  // --- ENS160 ---
  if (ens160.available()) {
    ens160.measure(true);
    ens160.measureRaw(true);

    int aqi  = ens160.getAQI();
    int tvoc = ens160.getTVOC();
    int eco2 = ens160.geteCO2();

    const char *status = "GOOD";
    if (aqi > 100) status = "MODERATE";
    if (aqi > 200) status = "BAD";

    lv_label_set_text_fmt(labelAQI, "AQI: %d\n%s", aqi, status);
    lv_label_set_text_fmt(labelTVOC, "TVOC:\n%d ppb", tvoc);
    lv_label_set_text_fmt(labelECO2, "eCO2:\n%d ppm", eco2);
  }

  // --- Dust Sensor ---
  float dust = dustSensor.getDustDensity();
  float avg  = dustSensor.getRunningAverage();
  lv_label_set_text_fmt(labelDust, "Dust:\n%.2f", avg);

  // Jalankan LVGL
  lv_timer_handler();
  delay(200);
}
