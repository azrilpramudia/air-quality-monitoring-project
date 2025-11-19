#include <Wire.h>             // Library for I2C communication
#include "ScioSense_ENS160.h" // ENS160 Air Quality Sensor Library
#include <GP2YDustSensor.h>   // GP2Y Dust Sensor Library
#include "Adafruit_SHT31.h"   // SHT31 Temperature & Humidity Sensor Library
#include <TFT_eSPI.h>         // TFT library for ESP32
#include <SPI.h>              // SPI communication library (used by TFT)
#include <lvgl.h>             // LVGL Graphics Library

// ------------------- TFT & LVGL -------------------
TFT_eSPI tft = TFT_eSPI(); // Create an object for the TFT screen control.
lv_display_t *disp;        // Pointer for LVGL display

#define SCREEN_WIDTH 320                          // Widht Screen TFT
#define SCREEN_HEIGHT 240                         // Height Screen TFT
#define BUF_LINES 10                              // Number of display buffer lines
static lv_color_t buf1[SCREEN_WIDTH * BUF_LINES]; // Buffer for LVGL rendering

// ------------------- Pin Definitions -------------------
const uint8_t SHARP_LED_PIN = 25; // Dust sensor LED pin (controls internal LED of sensor)
const uint8_t SHARP_VO_PIN = 34;  // Dust sensor analog input pin (read sensor voltage)

// ------------------- Sensor Objects -------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);                                                // ENS160 Object Sensor (I2C)
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN); // GP2Y Dust Sensor Object
Adafruit_SHT31 sht31 = Adafruit_SHT31();                                                  // Object Sensor SHT31

// ------------------- LVGL UI Elements -------------------
lv_obj_t *arc_aqi, *label_aqi_val, *label_aqi_status;                                       // AQI Arc & Labels
lv_obj_t *label_temp_val, *label_hum_val, *label_tvoc_val, *label_co2_val, *label_dust_val; // Labels for sensor values

// ------------------- Forward Declarations -------------------
void ui_create();                                                                                            // Function to create interface display
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust);                              // Function for update sensor values on display
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h); // Function to create a card template for sensor values
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map);                              // LVGL flush function to update TFT

// ------------------- LVGL Flush Function -------------------
// Function to transfer the rendered buffer to the TFT display
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map)
{
  uint32_t w = area->x2 - area->x1 + 1; // Calculate the width of the area you want to draw.
  uint32_t h = area->y2 - area->y1 + 1; // Calculate the height of the area you want to draw.

  uint16_t *data = (uint16_t *)px_map; // Convert the pixel data to 16-bit color format.

  tft.startWrite();                            // Start communication with the TFT
  tft.setAddrWindow(area->x1, area->y1, w, h); // Set the area to update
  tft.pushColors(data, w * h, true);           // Send the pixel data to the TFT
  tft.endWrite();                              // End communication with the TFT

  lv_display_flush_ready(disp); // Inform LVGL that flushing is done
}

// ------------------- Running Average Config -------------------
#define AVG_WINDOW 10         // Number of samples for running average
float tempBuffer[AVG_WINDOW]; // save last temperature data
int tvocBuffer[AVG_WINDOW];   // save last TVOC data
int eco2Buffer[AVG_WINDOW];   // save last eCO2 data
float dustBuffer[AVG_WINDOW]; // buffer to store last dust sensor values
int avgIndex = 0;             // index for the current position in the buffer
bool bufferFilled = false;    // flag to indicate if the buffer is filled

// Function to calculate the average of float values (e.g., temperature)
float averageFloat(float *buf, int size)
{
  float sum = 0;
  for (int i = 0; i < size; i++)
    sum += buf[i];   // calculate the sum of all data
  return sum / size; // divide by size to get the average
}

// Function to calculate the average of integer values (e.g., TVOC, eCO2)
float averageInt(int *buf, int size)
{
  long sum = 0;
  for (int i = 0; i < size; i++)
    sum += buf[i];          // calculate the sum of all data
  return (float)sum / size; // modify to return float average
}

// ------------------- SETUP -------------------
void setup()
{
  Serial.begin(115200); // start serial communication at 115200 baud rate
  Wire.begin(21, 22);   // Initialize I2C with SDA on GPIO 21 and SCL on GPIO 22

  pinMode(32, OUTPUT);    // Set pin 32 as output for TFT backlight
  digitalWrite(32, HIGH); // Turn on the TFT backlight

  // --- Initialization TFT Screen ---
  tft.init();                // Start TFT
  tft.setRotation(1);        // Set orientation to landscape
  tft.fillScreen(TFT_BLACK); // Clear the screen to black

  // --- Initialization LVGL ---
  lv_init();                                                                              // Start LVGL
  disp = lv_display_create(SCREEN_WIDTH, SCREEN_HEIGHT);                                  // create a display object
  lv_display_set_flush_cb(disp, my_disp_flush);                                           // Connect LVGL to flush function
  lv_display_set_buffers(disp, buf1, NULL, sizeof(buf1), LV_DISPLAY_RENDER_MODE_PARTIAL); // Set buffer image

  // --- Initialization Sensor ---
  Serial.println("Inisialisasi sensor...");
  if (!ens160.begin())
    Serial.println("ENS160 gagal ditemukan!"); // Check ENS160 Sensor
  else
  {
    ens160.setMode(ENS160_OPMODE_STD); // Set Standard mode (continuous measurement)
    Serial.println("ENS160 OK");
  }

  if (!sht31.begin(0x44))
  { // Check SHT31 Sensor
    Serial.println("SHT31 gagal ditemukan! Periksa koneksi SDA/SCL.");
    while (1)
      delay(1); // Stop here if sensor not found
  }

  dustSensor.begin(); // Start Dust Sensor

  // --- Average buffer initialization ---
  for (int i = 0; i < AVG_WINDOW; i++)
  { // Set all buffer values to 0
    tempBuffer[i] = 0;
    tvocBuffer[i] = 0;
    eco2Buffer[i] = 0;
    dustBuffer[i] = 0;
  }

  // --- Create UI View ---
  ui_create(); // call the function to create the UI
  Serial.println("UI berhasil dibuat");
  Serial.println("Sistem siap.\n");
}

// ------------------- LOOP -------------------
void loop()
{
  lv_timer_handler(); // Run LVGL internal processes (so the UI can be updated)
  delay(5);           // Small delay to allow LVGL to process

  static unsigned long lastUpdate = 0; // save the last update time
  unsigned long now = millis();        // get the current time

  // check if 1 second has passed since the last update
  if (now - lastUpdate >= 1000)
  {
    lastUpdate = now; // save the current time as the last update time

    // --- Read data from temperature & humidity sensors ---
    float t = sht31.readTemperature(); // Read Temperature (°C)
    float h = sht31.readHumidity();    // Read Humidity (%)

    // if any reads failed, print an error message and return
    if (isnan(t) || isnan(h))
    {
      Serial.println("Gagal membaca SHT31!");
      return;
    }

    // send temperature & humidity data to ENS160 for compensation
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    ens160.measure(true);    // start measurement with compensation
    ens160.measureRaw(true); // start raw measurement (for VOC baseline)

    // get air quality data from ENS160
    int aqi = ens160.getAQI();                // Read Air Quality Index (1-5)
    int tvoc = ens160.getTVOC();              // Read Total Volatile Organic Compounds (ppb)
    int eco2 = ens160.geteCO2();              // Read equivalent CO2 (ppm)
    float dust = dustSensor.getDustDensity(); // Read Dust Density (ug/m3)

    // --- Save new values ​​to buffer for average ---
    tempBuffer[avgIndex] = t;    // Save latest temperature
    tvocBuffer[avgIndex] = tvoc; // Save latest TVOC
    eco2Buffer[avgIndex] = eco2; // Save latest eCO2
    dustBuffer[avgIndex] = dust; // Save latest dust value

    avgIndex++; // Move to next index
    if (avgIndex >= AVG_WINDOW)
    {                      // If the buffer is full
      avgIndex = 0;        // Reset index to 0
      bufferFilled = true; // Set flag to indicate buffer is filled
    }

    // --- Calculate the average of the stored data ---
    float avgT = averageFloat(tempBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgTVOC = averageInt(tvocBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgECO2 = averageInt(eco2Buffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgDust = averageFloat(dustBuffer, bufferFilled ? AVG_WINDOW : avgIndex); // Calculate average dust

    // --- Update the view with the latest data ---
    update_display(avgT, h, aqi, (int)avgTVOC, (int)avgECO2, avgDust); // call function to update display

    // Make sure the display is updated immediately
    lv_refr_now(NULL);
  }
}

// ------------------- UI Creation -------------------
// Function to create the user interface layout
void ui_create()
{
  lv_obj_t *scr = lv_scr_act();                                   // Get the current screen
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0a0e27), 0);      // Set background color
  lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x1a1f3a), 0); // Set gradient color
  lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);          // Vertical gradient

  // -------- Header / Title --------
  lv_obj_t *status_bar = lv_obj_create(scr);                        // Create status bar container
  lv_obj_set_size(status_bar, 320, 30);                             // Set size of the bar
  lv_obj_align(status_bar, LV_ALIGN_TOP_MID, 0, 0);                 // Position at the top center
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x1e2640), 0); // Set background color
  lv_obj_set_style_border_width(status_bar, 0, 0);                  // No border

  lv_obj_t *title = lv_label_create(status_bar);           // Create title label
  lv_label_set_text(title, "AIR QUALITY MONITOR");         // Set title text
  lv_obj_set_style_text_color(title, lv_color_white(), 0); // Set text color to white
  lv_obj_align(title, LV_ALIGN_CENTER, 0, 0);              // Center the title

  // -------- AQI (Arc) Display --------
  lv_obj_t *aqi_container = lv_obj_create(scr);                        // Create AQI container
  lv_obj_set_size(aqi_container, 130, 140);                            // Set size of the container
  lv_obj_align(aqi_container, LV_ALIGN_LEFT_MID, 5, 10);               // Position on the left side
  lv_obj_set_style_bg_color(aqi_container, lv_color_hex(0x1e2640), 0); // Set background color
  lv_obj_set_style_border_width(aqi_container, 2, 0);                  // Set border width

  arc_aqi = lv_arc_create(aqi_container);            // Create AQI arc
  lv_obj_set_size(arc_aqi, 100, 100);                // Set size of the arc
  lv_obj_align(arc_aqi, LV_ALIGN_CENTER, 0, -5);     // Center the arc
  lv_arc_set_rotation(arc_aqi, 135);                 // Rotate to start at 135 degrees
  lv_arc_set_bg_angles(arc_aqi, 0, 270);             // Set background arc from 0 to 270 degrees
  lv_arc_set_value(arc_aqi, 0);                      // Initial value 0
  lv_obj_clear_flag(arc_aqi, LV_OBJ_FLAG_CLICKABLE); // Make arc non-interactive

  label_aqi_val = lv_label_create(aqi_container); // Label for AQI value
  lv_label_set_text(label_aqi_val, "0");
  lv_obj_set_style_text_color(label_aqi_val, lv_color_white(), 0);
  lv_obj_align(label_aqi_val, LV_ALIGN_CENTER, 0, -15);
  lv_obj_set_style_transform_scale(label_aqi_val, 300, 0); // Make text larger

  lv_obj_t *lbl_aqi_txt = lv_label_create(aqi_container); // Label "AQI" text
  lv_label_set_text(lbl_aqi_txt, "AQI");
  lv_obj_set_style_text_color(lbl_aqi_txt, lv_color_hex(0x8b92a8), 0);
  lv_obj_align(lbl_aqi_txt, LV_ALIGN_CENTER, 0, 15);

  label_aqi_status = lv_label_create(aqi_container); // Label for AQI status text
  lv_label_set_text(label_aqi_status, "---");
  lv_obj_align(label_aqi_status, LV_ALIGN_BOTTOM_MID, 0, -5);

  // -------- Other sensor cards --------
  int card_w = 85, card_h = 60, start_x = 145, start_y = 40, gap = 8; // Card dimensions and positions

  lv_obj_t *card_temp = create_card(scr, "TEMP", lv_color_hex(0xff6b6b), start_x, start_y, card_w, card_h);
  label_temp_val = lv_label_create(card_temp); // Labels temperature
  lv_label_set_text(label_temp_val, "-- °C");
  lv_obj_align(label_temp_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_hum = create_card(scr, "HUM", lv_color_hex(0x4ecdc4), start_x + card_w + gap, start_y, card_w, card_h);
  label_hum_val = lv_label_create(card_hum); // Labels humidity
  lv_label_set_text(label_hum_val, "-- %");
  lv_obj_align(label_hum_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_tvoc = create_card(scr, "TVOC", lv_color_hex(0xf9ca24), start_x, start_y + card_h + gap, card_w, card_h);
  label_tvoc_val = lv_label_create(card_tvoc); // Labels TVOC
  lv_label_set_text(label_tvoc_val, "-- ppb");
  lv_obj_align(label_tvoc_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_co2 = create_card(scr, "eCO2", lv_color_hex(0xa29bfe), start_x + card_w + gap, start_y + card_h + gap, card_w, card_h);
  label_co2_val = lv_label_create(card_co2); // Labels eCO2
  lv_label_set_text(label_co2_val, "-- ppm");
  lv_obj_align(label_co2_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_dust = create_card(scr, "DUST", lv_color_hex(0xfd79a8), start_x, start_y + 2 * (card_h + gap), card_w * 2 + gap, card_h);
  label_dust_val = lv_label_create(card_dust); // Labels dust
  lv_label_set_text(label_dust_val, "-- ug/m3");
  lv_obj_align(label_dust_val, LV_ALIGN_CENTER, 0, 5);
}

// ------------------- CARD TEMPLATE -------------------
// Function to create small card displays in UI (for temperature, humidity, etc.)
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h)
{
  lv_obj_t *card = lv_obj_create(parent);       // Create a container object for the card
  lv_obj_set_size(card, w, h);                  // Set size of the card
  lv_obj_set_pos(card, x, y);                   // Set position of the card
  lv_obj_set_style_bg_color(card, bg_color, 0); // Set background color
  lv_obj_set_style_border_width(card, 0, 0);    // No border
  lv_obj_set_style_radius(card, 12, 0);         // Rounded corners
  lv_obj_set_style_pad_all(card, 5, 0);         // Padding inside the card

  lv_obj_t *lbl_title = lv_label_create(card); // Create title label
  lv_label_set_text(lbl_title, title);
  lv_obj_set_style_text_color(lbl_title, lv_color_white(), 0);
  lv_obj_align(lbl_title, LV_ALIGN_TOP_LEFT, 3, 2); // Position at top-left corner
  return card;                                      // Return the created card object
}

// ------------------- UPDATE DISPLAY -------------------
// Function to update sensor values on the display
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust)
{
  static char buf[32]; // Buffer for formatted text

  // --- Update values ​​on screen ---
  sprintf(buf, "%.1f °C", t);
  lv_label_set_text(label_temp_val, buf); // Temperature
  sprintf(buf, "%.0f %%", h);
  lv_label_set_text(label_hum_val, buf); // Humidity
  sprintf(buf, "%d ppb", tvoc);
  lv_label_set_text(label_tvoc_val, buf); // TVOC
  sprintf(buf, "%d ppm", eco2);
  lv_label_set_text(label_co2_val, buf); // eCO2
  sprintf(buf, "%.1f ug/m3", dust);
  lv_label_set_text(label_dust_val, buf); // Dust

  // --- Update AQI Screen ---
  int aqi_clamped = constrain(aqi, 1, 5);       // Clamp AQI to 1-5 range
  int arc_val = map(aqi_clamped, 1, 5, 0, 100); // Map AQI to arc value (0-100)
  lv_arc_set_value(arc_aqi, arc_val);           // Set arc value

  sprintf(buf, "%d", aqi); // Format AQI value
  lv_label_set_text(label_aqi_val, buf);

  const char *status; // Status text based on air quality
  lv_color_t color;   // Color associated with air quality

  // --- Determine status based on AQI ---
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

  // --- Apply color and text to the AQI display ---
  lv_label_set_text(label_aqi_status, status);                   // show status text
  lv_obj_set_style_text_color(label_aqi_status, color, 0);       // Color status text
  lv_obj_set_style_arc_color(arc_aqi, color, LV_PART_INDICATOR); // Arc color
  lv_obj_set_style_text_color(label_aqi_val, color, 0);          // AQI value color

  // --- Print to Serial Monitor ---
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
