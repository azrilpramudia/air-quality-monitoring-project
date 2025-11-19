#include <Wire.h>             // Library for I2C communication
#include "ScioSense_ENS160.h" // Library for ENS160 air quality sensor
#include <GP2YDustSensor.h>   // Library for GP2Y dust sensor
#include "Adafruit_SHT31.h"   // Library for SHT31 temperature & humidity sensor
#include <TFT_eSPI.h>         // Library for TFT display
#include <SPI.h>              // SPI communication library (used by TFT)
#include <lvgl.h>             // LVGL graphics library (GUI)

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
ScioSense_ENS160 ens160(ENS160_I2CADDR_1);                                                // ENS160 sensor object (I2C)
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN); // Dust sensor object
Adafruit_SHT31 sht31 = Adafruit_SHT31();                                                  // SHT31 temperature & humidity sensor object

// ------------------- LVGL UI Elements -------------------
lv_obj_t *arc_aqi, *label_aqi_val, *label_aqi_status;                                       // UI elements for AQI
lv_obj_t *label_temp_val, *label_hum_val, *label_tvoc_val, *label_co2_val, *label_dust_val; // Labels for sensor data

// ------------------- Forward Declarations -------------------
void ui_create();                                                                                            // Function to create the user interface
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust);                              // Function to update sensor data display
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h); // Create sensor card UI
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map);                              // TFT flush function

// ------------------- LVGL Flush Function -------------------
// This function is called by LVGL to render the display to the TFT
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map)
{
  uint32_t w = area->x2 - area->x1 + 1; // Calculate width of drawing area
  uint32_t h = area->y2 - area->y1 + 1; // Calculate height of drawing area

  uint16_t *data = (uint16_t *)px_map; // Convert pixel pointer to 16-bit color format

  tft.startWrite();                            // Start communication with the TFT
  tft.setAddrWindow(area->x1, area->y1, w, h); // Set drawing area
  tft.pushColors(data, w * h, true);           // Send color data to TFT
  tft.endWrite();                              // Finish sending data

  lv_display_flush_ready(disp); // Notify LVGL that rendering is done
}

// ------------------- Running Average Config -------------------
#define AVG_WINDOW 10         // Number of samples for averaging
float tempBuffer[AVG_WINDOW]; // Store last temperature readings
int tvocBuffer[AVG_WINDOW];   // Store last TVOC readings
int eco2Buffer[AVG_WINDOW];   // Store last eCO2 readings
float dustBuffer[AVG_WINDOW]; // Store last dust readings
int avgIndex = 0;             // Index of latest data
bool bufferFilled = false;    // Flag if buffer is full

// Function to calculate average of float values (e.g. temperature)
float averageFloat(float *buf, int size)
{
  float sum = 0;
  for (int i = 0; i < size; i++)
    sum += buf[i];   // Sum all values
  return sum / size; // Divide by count
}

// Function to calculate average of integer values (e.g. TVOC/eCO2)
float averageInt(int *buf, int size)
{
  long sum = 0;
  for (int i = 0; i < size; i++)
    sum += buf[i];          // Sum all values
  return (float)sum / size; // Convert to float and divide
}

// ------------------- SETUP -------------------
void setup()
{
  Serial.begin(115200); // Start serial communication for debugging
  Wire.begin(21, 22);   // Initialize I2C (SDA = 21, SCL = 22)

  pinMode(32, OUTPUT);    // Set pin 32 as output
  digitalWrite(32, HIGH); // Turn on TFT backlight

  // --- Initialize TFT display ---
  tft.init();                // Initialize TFT
  tft.setRotation(1);        // Set horizontal orientation
  tft.fillScreen(TFT_BLACK); // Clear screen with black color

  // --- Initialize LVGL ---
  lv_init();                                                                              // Initialize LVGL
  disp = lv_display_create(SCREEN_WIDTH, SCREEN_HEIGHT);                                  // Create new LVGL display
  lv_display_set_flush_cb(disp, my_disp_flush);                                           // Set flush callback
  lv_display_set_buffers(disp, buf1, NULL, sizeof(buf1), LV_DISPLAY_RENDER_MODE_PARTIAL); // Set drawing buffer

  // --- Initialize Sensors ---
  Serial.println("Initializing sensors...");
  if (!ens160.begin())
    Serial.println("ENS160 not found!"); // ENS160 check
  else
  {
    ens160.setMode(ENS160_OPMODE_STD); // Set standard mode
    Serial.println("ENS160 OK");
  }

  if (!sht31.begin(0x44))
  { // SHT31 check
    Serial.println("SHT31 not found! Check SDA/SCL connection.");
    while (1)
      delay(1); // Stop if failed
  }

  dustSensor.begin(); // Start dust sensor

  // --- Initialize averaging buffer ---
  for (int i = 0; i < AVG_WINDOW; i++)
  { // Set all initial values to 0
    tempBuffer[i] = 0;
    tvocBuffer[i] = 0;
    eco2Buffer[i] = 0;
    dustBuffer[i] = 0;
  }

  // --- Create UI ---
  ui_create(); // Call UI creation function
  Serial.println("UI created successfully");
  Serial.println("System ready.\n");
}

// ------------------- LOOP -------------------
void loop()
{
  lv_timer_handler(); // Run LVGL internal processes (UI updates)
  delay(5);           // Small delay for smoother refresh

  static unsigned long lastUpdate = 0; // Store last update time
  unsigned long now = millis();        // Get current time (ms since start)

  // Check if 1 second has passed since last read
  if (now - lastUpdate >= 1000)
  {
    lastUpdate = now; // Save last update time

    // --- Read temperature & humidity ---
    float t = sht31.readTemperature(); // Read temperature (°C)
    float h = sht31.readHumidity();    // Read humidity (%)

    // If reading failed, print message and skip this cycle
    if (isnan(t) || isnan(h))
    {
      Serial.println("Failed to read SHT31!");
      return;
    }

    // Send environmental data to ENS160 (for compensation)
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    ens160.measure(true);    // Run gas measurement
    ens160.measureRaw(true); // Run raw measurement

    // Get ENS160 measurement results
    int aqi = ens160.getAQI();                // Read AQI (1–5)
    int tvoc = ens160.getTVOC();              // Read total VOC (ppb)
    int eco2 = ens160.geteCO2();              // Read estimated CO2 (ppm)
    float dust = dustSensor.getDustDensity(); // Read dust density (µg/m³)

    // --- Store new values into buffers ---
    tempBuffer[avgIndex] = t;    // Store temperature
    tvocBuffer[avgIndex] = tvoc; // Store TVOC
    eco2Buffer[avgIndex] = eco2; // Store eCO2
    dustBuffer[avgIndex] = dust; // Store dust value

    avgIndex++; // Move to next buffer position
    if (avgIndex >= AVG_WINDOW)
    {                      // If reached buffer end
      avgIndex = 0;        // Reset index
      bufferFilled = true; // Mark buffer as full
    }

    // --- Compute averaged values ---
    float avgT = averageFloat(tempBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgTVOC = averageInt(tvocBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgECO2 = averageInt(eco2Buffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgDust = averageFloat(dustBuffer, bufferFilled ? AVG_WINDOW : avgIndex); // Average dust

    // --- Update display with latest values ---
    update_display(avgT, h, aqi, (int)avgTVOC, (int)avgECO2, avgDust); // Show averaged data

    // Force LVGL to refresh immediately
    lv_refr_now(NULL);
  }
}

// ------------------- UI Creation -------------------
// Function to build the complete UI layout
void ui_create()
{
  lv_obj_t *scr = lv_scr_act();                                   // Get active LVGL screen
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0a0e27), 0);      // Background color
  lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x1a1f3a), 0); // Gradient bottom color
  lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);          // Vertical gradient direction

  // -------- Header / Title --------
  lv_obj_t *status_bar = lv_obj_create(scr);                        // Create top bar
  lv_obj_set_size(status_bar, 320, 30);                             // Bar size 320x30
  lv_obj_align(status_bar, LV_ALIGN_TOP_MID, 0, 0);                 // Align to top
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x1e2640), 0); // Bar color
  lv_obj_set_style_border_width(status_bar, 0, 0);                  // Remove border

  lv_obj_t *title = lv_label_create(status_bar);           // Add title text
  lv_label_set_text(title, "AIR QUALITY MONITORING");      // Title text
  lv_obj_set_style_text_color(title, lv_color_white(), 0); // White text
  lv_obj_align(title, LV_ALIGN_CENTER, 0, 0);              // Centered text

  // -------- AQI Display (Arc) --------
  lv_obj_t *aqi_container = lv_obj_create(scr);                        // Create AQI container
  lv_obj_set_size(aqi_container, 130, 140);                            // Container size
  lv_obj_align(aqi_container, LV_ALIGN_LEFT_MID, 5, 18);               // Align left middle
  lv_obj_set_style_bg_color(aqi_container, lv_color_hex(0x1e2640), 0); // Background color
  lv_obj_set_style_border_width(aqi_container, 2, 0);                  // Thin border

  arc_aqi = lv_arc_create(aqi_container);            // Create AQI circular arc
  lv_obj_set_size(arc_aqi, 100, 100);                // Arc size
  lv_obj_align(arc_aqi, LV_ALIGN_CENTER, 0, -5);     // Center position
  lv_arc_set_rotation(arc_aqi, 135);                 // Start rotation
  lv_arc_set_bg_angles(arc_aqi, 0, 270);             // 270° range
  lv_arc_set_value(arc_aqi, 0);                      // Initial value
  lv_obj_clear_flag(arc_aqi, LV_OBJ_FLAG_CLICKABLE); // Disable touch

  label_aqi_val = lv_label_create(aqi_container); // AQI numeric label
  lv_label_set_text(label_aqi_val, "0");
  lv_obj_set_style_text_color(label_aqi_val, lv_color_white(), 0);
  lv_obj_align(label_aqi_val, LV_ALIGN_CENTER, 0, -15);
  lv_obj_set_style_transform_scale(label_aqi_val, 300, 0); // Enlarge text

  lv_obj_t *lbl_aqi_txt = lv_label_create(aqi_container); // "AQI" text label
  lv_label_set_text(lbl_aqi_txt, "AQI");
  lv_obj_set_style_text_color(lbl_aqi_txt, lv_color_hex(0x8b92a8), 0);
  lv_obj_align(lbl_aqi_txt, LV_ALIGN_CENTER, 0, 15);

  label_aqi_status = lv_label_create(aqi_container); // AQI status label
  lv_label_set_text(label_aqi_status, "---");
  lv_obj_align(label_aqi_status, LV_ALIGN_BOTTOM_MID, 0, -5);

  // -------- Sensor Cards --------
  int card_w = 82, card_h = 60, start_x = 143, start_y = 40, gap = 8; // Card size & layout

  lv_obj_t *card_temp = create_card(scr, "TEMP", lv_color_hex(0xff6b6b), start_x, start_y, card_w, card_h);
  label_temp_val = lv_label_create(card_temp); // Temperature label
  lv_label_set_text(label_temp_val, "-- °C");
  lv_obj_align(label_temp_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_hum = create_card(scr, "HUM", lv_color_hex(0x4ecdc4), start_x + card_w + gap, start_y, card_w, card_h);
  label_hum_val = lv_label_create(card_hum); // Humidity label
  lv_label_set_text(label_hum_val, "-- %");
  lv_obj_align(label_hum_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_tvoc = create_card(scr, "TVOC", lv_color_hex(0xf9ca24), start_x, start_y + card_h + gap, card_w, card_h);
  label_tvoc_val = lv_label_create(card_tvoc); // TVOC label
  lv_label_set_text(label_tvoc_val, "-- ppb");
  lv_obj_align(label_tvoc_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_co2 = create_card(scr, "eCO2", lv_color_hex(0xa29bfe), start_x + card_w + gap, start_y + card_h + gap, card_w, card_h);
  label_co2_val = lv_label_create(card_co2); // eCO2 label
  lv_label_set_text(label_co2_val, "-- ppm");
  lv_obj_align(label_co2_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_dust = create_card(scr, "DUST", lv_color_hex(0xfd79a8),
                                    start_x, start_y + 2 * (card_h + gap) - 3,
                                    card_w * 2 + gap, card_h);
  label_dust_val = lv_label_create(card_dust); // Dust label
  lv_label_set_text(label_dust_val, "-- ug/m3");
  lv_obj_align(label_dust_val, LV_ALIGN_CENTER, 0, 5);
}

// ------------------- CARD TEMPLATE -------------------
// Function to create reusable card components (for temperature, humidity, etc.)
lv_obj_t *create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h)
{
  lv_obj_t *card = lv_obj_create(parent);       // Create new card object
  lv_obj_set_size(card, w, h);                  // Set size
  lv_obj_set_pos(card, x, y);                   // Set position
  lv_obj_set_style_bg_color(card, bg_color, 0); // Background color
  lv_obj_set_style_border_width(card, 0, 0);    // Remove border
  lv_obj_set_style_radius(card, 12, 0);         // Rounded corners
  lv_obj_set_style_pad_all(card, 5, 0);         // Inner padding

  lv_obj_t *lbl_title = lv_label_create(card); // Title label (e.g. "TEMP")
  lv_label_set_text(lbl_title, title);
  lv_obj_set_style_text_color(lbl_title, lv_color_white(), 0);
  lv_obj_align(lbl_title, LV_ALIGN_TOP_LEFT, 3, 2); // Top-left position
  return card;                                      // Return card object
}

// ------------------- UPDATE DISPLAY -------------------
// Function to update sensor values and AQI status on screen
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust)
{
  static char buf[32]; // Temporary text buffer

  // --- Update value labels ---
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

  // --- Update AQI display ---
  int aqi_clamped = constrain(aqi, 1, 5);       // Clamp AQI to 1–5
  int arc_val = map(aqi_clamped, 1, 5, 0, 100); // Map to 0–100```cpp
  lv_arc_set_value(arc_aqi, arc_val);           // Update arc indicator

  sprintf(buf, "%d", aqi); // Update numeric AQI
  lv_label_set_text(label_aqi_val, buf);

  const char *status; // AQI status text
  lv_color_t color;   // Color based on air condition

  // --- Define status by AQI level ---
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

  // --- Apply color & text updates ---
  lv_label_set_text(label_aqi_status, status);                   // Set AQI text
  lv_obj_set_style_text_color(label_aqi_status, color, 0);       // Set status color
  lv_obj_set_style_arc_color(arc_aqi, color, LV_PART_INDICATOR); // Arc color
  lv_obj_set_style_text_color(label_aqi_val, color, 0);          // Numeric color

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
