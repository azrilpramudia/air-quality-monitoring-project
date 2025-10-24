#include <Wire.h>             // Library for I2C communication
#include "ScioSense_ENS160.h" // Library for ENS160 air quality sensor
#include <GP2YDustSensor.h>   // Library for GP2Y dust sensor
#include "Adafruit_SHT31.h"   // Library for SHT31 temperature & humidity sensor
#include <TFT_eSPI.h>         // Library for TFT display
#include <SPI.h>              // SPI communication library (used by TFT)
#include <lvgl.h>             // LVGL graphics library (GUI)
#include <WiFi.h>             // Added: WiFi library
#include <PubSubClient.h>     // Added: MQTT library

// ------------------- WiFi & MQTT Config -------------------
#define WIFI_SSID "" // input your wifi ssid
#define WIFI_PASS ""  // input your wifi password
#define MQTT_SERVER "" // input your mqtt server local or global
#define MQTT_PORT // "1883" input your port
#define MQTT_TOPIC "air/quality" // input your topic

WiFiClient espClient;
PubSubClient client(espClient);

// ------------------- TFT & LVGL -------------------
TFT_eSPI tft = TFT_eSPI(); // Create TFT control object
lv_display_t *disp;        // Pointer for LVGL display

#define SCREEN_WIDTH 320                          // TFT screen width
#define SCREEN_HEIGHT 240                         // TFT screen height
#define BUF_LINES 10                              // Number of buffer lines for display
static lv_color_t buf1[SCREEN_WIDTH * BUF_LINES]; // Buffer for LVGL rendering

// ------------------- Pin Definitions -------------------
const uint8_t SHARP_LED_PIN = 25; // Dust sensor LED control pin
const uint8_t SHARP_VO_PIN = 34;  // Analog input pin for dust sensor voltage

// ------------------- Sensor Objects -------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN);
Adafruit_SHT31 sht31 = Adafruit_SHT31();

// ------------------- LVGL UI Elements -------------------
lv_obj_t *arc_aqi, *label_aqi_val, *label_aqi_status;
lv_obj_t *label_temp_val, *label_hum_val, *label_tvoc_val, *label_co2_val, *label_dust_val;

// ------------------- Forward Declarations -------------------
void ui_create();
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust);
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h);
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map);

// ------------------- Running Average Config -------------------
#define AVG_WINDOW 10
float tempBuffer[AVG_WINDOW];
int tvocBuffer[AVG_WINDOW];
int eco2Buffer[AVG_WINDOW];
float dustBuffer[AVG_WINDOW];
int avgIndex = 0;
bool bufferFilled = false;

// ------------------- MQTT Helper Functions -------------------
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  client.setServer(MQTT_SERVER, MQTT_PORT);
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32_AQM")) {
      Serial.println("connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2s...");
      delay(2000);
    }
  }
}

// ------------------- LVGL Flush Function -------------------
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map)
{
  uint32_t w = area->x2 - area->x1 + 1;
  uint32_t h = area->y2 - area->y1 + 1;
  uint16_t *data = (uint16_t *)px_map;

  tft.startWrite();
  tft.setAddrWindow(area->x1, area->y1, w, h);
  tft.pushColors(data, w * h, true);
  tft.endWrite();

  lv_display_flush_ready(disp);
}

// ------------------- Averaging Helpers -------------------
float averageFloat(float *buf, int size)
{
  float sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i];
  return sum / size;
}

float averageInt(int *buf, int size)
{
  long sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i];
  return (float)sum / size;
}

// ------------------- SETUP -------------------
void setup()
{
  Serial.begin(115200);
  Wire.begin(21, 22);

  pinMode(32, OUTPUT);
  digitalWrite(32, HIGH);

  // --- Initialize TFT & LVGL ---
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);

  lv_init();
  disp = lv_display_create(SCREEN_WIDTH, SCREEN_HEIGHT);
  lv_display_set_flush_cb(disp, my_disp_flush);
  lv_display_set_buffers(disp, buf1, NULL, sizeof(buf1), LV_DISPLAY_RENDER_MODE_PARTIAL);

  // --- Initialize Sensors ---
  Serial.println("Initializing sensors...");
  if (!ens160.begin()) Serial.println("ENS160 not found!");
  else {
    ens160.setMode(ENS160_OPMODE_STD);
    Serial.println("ENS160 OK");
  }

  if (!sht31.begin(0x44)) {
    Serial.println("SHT31 not found! Check SDA/SCL connection.");
    while (1) delay(1);
  }

  dustSensor.begin();

  for (int i = 0; i < AVG_WINDOW; i++) {
    tempBuffer[i] = 0;
    tvocBuffer[i] = 0;
    eco2Buffer[i] = 0;
    dustBuffer[i] = 0;
  }

  // --- UI ---
  ui_create();
  Serial.println("UI created successfully");

  // --- WiFi + MQTT ---
  connectWiFi();
  connectMQTT();

  Serial.println("System ready.\n");
}

// ------------------- LOOP -------------------
void loop()
{
  lv_timer_handler();
  delay(5);

  static unsigned long lastUpdate = 0;
  unsigned long now = millis();

  if (now - lastUpdate >= 1000)
  {
    lastUpdate = now;

    float t = sht31.readTemperature();
    float h = sht31.readHumidity();

    if (isnan(t) || isnan(h)) {
      Serial.println("Failed to read SHT31!");
      return;
    }

    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    ens160.measure(true);
    ens160.measureRaw(true);

    int aqi = ens160.getAQI();
    int tvoc = ens160.getTVOC();
    int eco2 = ens160.geteCO2();
    float dust = dustSensor.getDustDensity();

    tempBuffer[avgIndex] = t;
    tvocBuffer[avgIndex] = tvoc;
    eco2Buffer[avgIndex] = eco2;
    dustBuffer[avgIndex] = dust;

    avgIndex++;
    if (avgIndex >= AVG_WINDOW) {
      avgIndex = 0;
      bufferFilled = true;
    }

    float avgT = averageFloat(tempBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgTVOC = averageInt(tvocBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgECO2 = averageInt(eco2Buffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgDust = averageFloat(dustBuffer, bufferFilled ? AVG_WINDOW : avgIndex);

    update_display(avgT, h, aqi, (int)avgTVOC, (int)avgECO2, avgDust);

    // --- Publish to MQTT ---
    if (client.connected()) {
      char payload[160];
      sprintf(payload,
              "{\"temp\":%.1f,\"hum\":%.1f,\"tvoc\":%d,\"eco2\":%d,\"dust\":%.1f,\"aqi\":%d}",
              avgT, h, (int)avgTVOC, (int)avgECO2, avgDust, aqi);
      client.publish(MQTT_TOPIC, payload);
      client.loop();
    } else {
      connectMQTT();
    }

    lv_refr_now(NULL);
  }
}

// ------------------- UI Creation -------------------
void ui_create()
{
  lv_obj_t *scr = lv_scr_act();
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0a0e27), 0);
  lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x1a1f3a), 0);
  lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);

  lv_obj_t *status_bar = lv_obj_create(scr);
  lv_obj_set_size(status_bar, 320, 30);
  lv_obj_align(status_bar, LV_ALIGN_TOP_MID, 0, 0);
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x1e2640), 0);
  lv_obj_set_style_border_width(status_bar, 0, 0);

  lv_obj_t *title = lv_label_create(status_bar);
  lv_label_set_text(title, "AIR QUALITY MONITORING");
  lv_obj_set_style_text_color(title, lv_color_white(), 0);
  lv_obj_align(title, LV_ALIGN_CENTER, 0, 0);

  lv_obj_t *aqi_container = lv_obj_create(scr);
  lv_obj_set_size(aqi_container, 130, 140);
  lv_obj_align(aqi_container, LV_ALIGN_LEFT_MID, 5, 18);
  lv_obj_set_style_bg_color(aqi_container, lv_color_hex(0x1e2640), 0);
  lv_obj_set_style_border_width(aqi_container, 2, 0);

  arc_aqi = lv_arc_create(aqi_container);
  lv_obj_set_size(arc_aqi, 100, 100);
  lv_obj_align(arc_aqi, LV_ALIGN_CENTER, 0, -5);
  lv_arc_set_rotation(arc_aqi, 135);
  lv_arc_set_bg_angles(arc_aqi, 0, 270);
  lv_arc_set_value(arc_aqi, 0);
  lv_obj_clear_flag(arc_aqi, LV_OBJ_FLAG_CLICKABLE);

  label_aqi_val = lv_label_create(aqi_container);
  lv_label_set_text(label_aqi_val, "0");
  lv_obj_set_style_text_color(label_aqi_val, lv_color_white(), 0);
  lv_obj_align(label_aqi_val, LV_ALIGN_CENTER, 0, -15);
  lv_obj_set_style_transform_scale(label_aqi_val, 300, 0);

  lv_obj_t *lbl_aqi_txt = lv_label_create(aqi_container);
  lv_label_set_text(lbl_aqi_txt, "AQI");
  lv_obj_set_style_text_color(lbl_aqi_txt, lv_color_hex(0x8b92a8), 0);
  lv_obj_align(lbl_aqi_txt, LV_ALIGN_CENTER, 0, 15);

  label_aqi_status = lv_label_create(aqi_container);
  lv_label_set_text(label_aqi_status, "---");
  lv_obj_align(label_aqi_status, LV_ALIGN_BOTTOM_MID, 0, -5);

  int card_w = 82, card_h = 60, start_x = 143, start_y = 40, gap = 8;

  lv_obj_t *card_temp = create_card(scr, "TEMP", lv_color_hex(0xff6b6b), start_x, start_y, card_w, card_h);
  label_temp_val = lv_label_create(card_temp);
  lv_label_set_text(label_temp_val, "-- °C");
  lv_obj_align(label_temp_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_hum = create_card(scr, "HUM", lv_color_hex(0x4ecdc4), start_x + card_w + gap, start_y, card_w, card_h);
  label_hum_val = lv_label_create(card_hum);
  lv_label_set_text(label_hum_val, "-- %");
  lv_obj_align(label_hum_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_tvoc = create_card(scr, "TVOC", lv_color_hex(0xf9ca24), start_x, start_y + card_h + gap, card_w, card_h);
  label_tvoc_val = lv_label_create(card_tvoc);
  lv_label_set_text(label_tvoc_val, "-- ppb");
  lv_obj_align(label_tvoc_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_co2 = create_card(scr, "eCO2", lv_color_hex(0xa29bfe), start_x + card_w + gap, start_y + card_h + gap, card_w, card_h);
  label_co2_val = lv_label_create(card_co2);
  lv_label_set_text(label_co2_val, "-- ppm");
  lv_obj_align(label_co2_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_dust = create_card(scr, "DUST", lv_color_hex(0xfd79a8),
                                    start_x, start_y + 2 * (card_h + gap) - 3,
                                    card_w * 2 + gap, card_h);
  label_dust_val = lv_label_create(card_dust);
  lv_label_set_text(label_dust_val, "-- ug/m3");
  lv_obj_align(label_dust_val, LV_ALIGN_CENTER, 0, 5);
}

// ------------------- CARD TEMPLATE -------------------
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h)
{
  lv_obj_t *card = lv_obj_create(parent);
  lv_obj_set_size(card, w, h);
  lv_obj_set_pos(card, x, y);
  lv_obj_set_style_bg_color(card, bg_color, 0);
  lv_obj_set_style_border_width(card, 0, 0);
  lv_obj_set_style_radius(card, 12, 0);
  lv_obj_set_style_pad_all(card, 5, 0);

  lv_obj_t *lbl_title = lv_label_create(card);
  lv_label_set_text(lbl_title, title);
  lv_obj_set_style_text_color(lbl_title, lv_color_white(), 0);
  lv_obj_align(lbl_title, LV_ALIGN_TOP_LEFT, 3, 2);
  return card;
}

// ------------------- UPDATE DISPLAY -------------------
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust)
{
  static char buf[32];

  sprintf(buf, "%.1f °C", t);
  lv_label_set_text(label_temp_val, buf);
  sprintf(buf, "%.0f %%", h);
  lv_label_set_text(label_hum_val, buf);
  sprintf(buf, "%d ppb", tvoc);
  lv_label_set_text(label_tvoc_val, buf);
  sprintf(buf, "%d ppm", eco2);
  lv_label_set_text(label_co2_val, buf);
  sprintf(buf, "%.1f ug/m3", dust);
  lv_label_set_text(label_dust_val, buf);

  int aqi_clamped = constrain(aqi, 1, 5);
  int arc_val = map(aqi_clamped, 1, 5, 0, 100);
  lv_arc_set_value(arc_aqi, arc_val);

  sprintf(buf, "%d", aqi);
  lv_label_set_text(label_aqi_val, buf);

  const char *status;
  lv_color_t color;

  switch (aqi_clamped)
  {
  case 1:
    status = "GOOD";
    color = lv_color_hex(0x00ff88);
    break;
  case 2:
    status = "MODERATE";
    color = lv_color_hex(0xffeb3b);
    break;
  case 3:
    status = "UNHEALTHY";
    color = lv_color_hex(0xff9800);
    break;
  case 4:
    status = "VERY UNHEALTHY";
    color = lv_color_hex(0xff5722);
    break;
  case 5:
    status = "HAZARDOUS";
    color = lv_color_hex(0xff1744);
    break;
  default:
    status = "---";
    color = lv_color_hex(0xcccccc);
    break;
  }

  lv_label_set_text(label_aqi_status, status);
  lv_obj_set_style_text_color(label_aqi_status, color, 0);
  lv_obj_set_style_arc_color(arc_aqi, color, LV_PART_INDICATOR);
  lv_obj_set_style_text_color(label_aqi_val, color, 0);

  Serial.println("======================================");
  Serial.println("      AIR QUALITY MONITOR DATA        ");
  Serial.println("======================================");
  Serial.printf("Temperature (avg °C): %.1f\n", t);
  Serial.printf("Humidity (%%): %.0f\n", h);
  Serial.printf("TVOC (avg ppb): %d\n", tvoc);
  Serial.printf("eCO2 (avg ppm): %d\n", eco2);
  Serial.printf("Dust (ug/m3): %.1f\n", dust);
  Serial.printf("AQI (1–5): %d\n", aqi);
  Serial.printf("Status: %s\n", status);
  Serial.println("======================================\n");
}
