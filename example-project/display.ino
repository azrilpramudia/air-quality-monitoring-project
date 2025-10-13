#include <Wire.h>                  // Library untuk komunikasi I2C
#include "ScioSense_ENS160.h"      // Library sensor kualitas udara ENS160
#include <GP2YDustSensor.h>        // Library sensor debu GP2Y
#include "Adafruit_SHT31.h"        // Library sensor suhu & kelembapan SHT31
#include <TFT_eSPI.h>              // Library untuk layar TFT
#include <SPI.h>                   // Library komunikasi SPI (dipakai oleh TFT)
#include <lvgl.h>                  // Library grafis LVGL (GUI)


// ------------------- TFT & LVGL -------------------
TFT_eSPI tft = TFT_eSPI();         // Buat objek untuk kontrol layar TFT
lv_display_t *disp;                // Pointer untuk display LVGL

#define SCREEN_WIDTH  320          // Lebar layar TFT
#define SCREEN_HEIGHT 240          // Tinggi layar TFT
#define BUF_LINES     10           // Jumlah baris buffer tampilan
static lv_color_t buf1[SCREEN_WIDTH * BUF_LINES]; // Buffer untuk LVGL rendering


// ------------------- Pin Definitions -------------------
const uint8_t SHARP_LED_PIN = 25;  // Pin LED sensor debu (kontrol LED internal sensor)
const uint8_t SHARP_VO_PIN  = 34;  // Pin input analog sensor debu (baca tegangan sensor)


// ------------------- Sensor Objects -------------------
ScioSense_ENS160 ens160(ENS160_I2CADDR_1); // Objek sensor ENS160 (I2C)
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, SHARP_LED_PIN, SHARP_VO_PIN); // Objek sensor debu GP2Y
Adafruit_SHT31 sht31 = Adafruit_SHT31();   // Objek sensor suhu & kelembapan SHT31


// ------------------- LVGL UI Elements -------------------
lv_obj_t *arc_aqi, *label_aqi_val, *label_aqi_status; // Elemen tampilan untuk AQI
lv_obj_t *label_temp_val, *label_hum_val, *label_tvoc_val, *label_co2_val, *label_dust_val; // Label untuk data sensor


// ------------------- Forward Declarations -------------------
void ui_create();    // Fungsi untuk membuat tampilan antarmuka
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust); // Fungsi untuk update tampilan data
lv_obj_t* create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h); // Buat tampilan kartu sensor
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map); // Fungsi flush (gambar ulang) tampilan TFT


// ------------------- LVGL Flush Function -------------------
// Fungsi ini dipanggil LVGL untuk menampilkan gambar ke layar TFT
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map) {
  uint32_t w = area->x2 - area->x1 + 1;   // Hitung lebar area yang mau digambar
  uint32_t h = area->y2 - area->y1 + 1;   // Hitung tinggi area yang mau digambar

  uint16_t *data = (uint16_t *)px_map;    // Ubah pointer pixel jadi format 16-bit warna

  tft.startWrite();                       // Mulai komunikasi dengan layar
  tft.setAddrWindow(area->x1, area->y1, w, h); // Tentukan area yang mau digambar
  tft.pushColors(data, w * h, true);      // Kirim data warna ke layar
  tft.endWrite();                         // Selesai kirim data

  lv_display_flush_ready(disp);           // Beri tahu LVGL kalau gambar sudah selesai
}


// ------------------- Running Average Config -------------------
#define AVG_WINDOW 10                     // Jumlah data yang dipakai untuk rata-rata
float tempBuffer[AVG_WINDOW];             // Simpan data suhu terakhir
int tvocBuffer[AVG_WINDOW];               // Simpan data TVOC terakhir
int eco2Buffer[AVG_WINDOW];               // Simpan data eCO2 terakhir
float dustBuffer[AVG_WINDOW];             // buffer untuk menyimpan data debu
int avgIndex = 0;                         // Indeks posisi data terbaru
bool bufferFilled = false;                // Penanda apakah buffer sudah penuh

// Fungsi untuk menghitung rata-rata nilai float (misal suhu)
float averageFloat(float *buf, int size) {
  float sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i]; // Jumlahkan semua data
  return sum / size;                            // Bagi total dengan jumlah data
}

// Fungsi untuk menghitung rata-rata nilai integer (misal TVOC/eCO2)
float averageInt(int *buf, int size) {
  long sum = 0;
  for (int i = 0; i < size; i++) sum += buf[i]; // Jumlahkan semua data
  return (float)sum / size;                     // Ubah ke float lalu bagi rata
}


// ------------------- SETUP -------------------
void setup() {
  Serial.begin(115200);                 // Mulai komunikasi serial untuk debug
  Wire.begin(21, 22);                   // Inisialisasi I2C (SDA = 21, SCL = 22)

  pinMode(32, OUTPUT);                  // Atur pin 32 jadi output
  digitalWrite(32, HIGH);               // Nyalakan backlight layar TFT

  // --- Inisialisasi Layar TFT ---
  tft.init();                           // Mulai TFT
  tft.setRotation(1);                   // Putar layar ke orientasi horizontal
  tft.fillScreen(TFT_BLACK);            // Bersihkan layar dengan warna hitam

  // --- Inisialisasi LVGL ---
  lv_init();                            // Mulai LVGL
  disp = lv_display_create(SCREEN_WIDTH, SCREEN_HEIGHT); // Buat display baru di LVGL
  lv_display_set_flush_cb(disp, my_disp_flush);          // Hubungkan LVGL ke fungsi flush
  lv_display_set_buffers(disp, buf1, NULL, sizeof(buf1), LV_DISPLAY_RENDER_MODE_PARTIAL); // Set buffer gambar

  // --- Inisialisasi Sensor ---
  Serial.println("Inisialisasi sensor...");
  if (!ens160.begin()) Serial.println("ENS160 gagal ditemukan!"); // Cek sensor ENS160
  else {
    ens160.setMode(ENS160_OPMODE_STD);                             // Set mode standar
    Serial.println("ENS160 OK");
  }

  if (!sht31.begin(0x44)) {                                        // Cek sensor SHT31
    Serial.println("SHT31 gagal ditemukan! Periksa koneksi SDA/SCL.");
    while (1) delay(1);                                            // Berhenti jika gagal
  }

  dustSensor.begin();                                              // Mulai sensor debu

  // --- Inisialisasi buffer rata-rata ---
  for (int i = 0; i < AVG_WINDOW; i++) {                           // Set semua nilai awal jadi nol
    tempBuffer[i] = 0;
    tvocBuffer[i] = 0;
    eco2Buffer[i] = 0;
    dustBuffer[i] = 0;
  }

  // --- Buat Tampilan UI ---
  ui_create();                                                     // Panggil fungsi buat UI
  Serial.println("UI berhasil dibuat");
  Serial.println("Sistem siap.\n");
}

// ------------------- LOOP -------------------
void loop() {
  lv_timer_handler();  // Jalankan proses internal LVGL (agar UI bisa diperbarui)
  delay(5);            // Delay kecil supaya tampilan halus dan tidak berat

  static unsigned long lastUpdate = 0;  // Simpan waktu update terakhir
  unsigned long now = millis();         // Ambil waktu saat ini (ms sejak start)

  // Cek apakah sudah 1 detik sejak pembacaan terakhir
  if (now - lastUpdate >= 1000) {
    lastUpdate = now;                   // Simpan waktu update terbaru

    // --- Baca data dari sensor suhu & kelembapan ---
    float t = sht31.readTemperature();  // Baca suhu (°C)
    float h = sht31.readHumidity();     // Baca kelembapan (%)

    // Jika pembacaan gagal, tampilkan pesan dan hentikan loop sementara
    if (isnan(t) || isnan(h)) {
      Serial.println("Gagal membaca SHT31!");
      return;
    }

    // Kirim data lingkungan ke ENS160 (untuk kompensasi)
    ens160.set_envdata((uint16_t)(h * 100), (int16_t)(t * 100));
    ens160.measure(true);               // Jalankan pengukuran gas
    ens160.measureRaw(true);            // Jalankan pengukuran mentah

    // Ambil hasil pembacaan ENS160
    int aqi  = ens160.getAQI();         // Baca nilai AQI (1–5)
    int tvoc = ens160.getTVOC();        // Baca total VOC (ppb)
    int eco2 = ens160.geteCO2();        // Baca estimasi CO2 (ppm)
    float dust = dustSensor.getDustDensity(); // Baca kepadatan debu (µg/m³)

    // --- Simpan nilai baru ke buffer untuk rata-rata ---
    tempBuffer[avgIndex] = t;           // Simpan suhu terbaru
    tvocBuffer[avgIndex] = tvoc;        // Simpan TVOC terbaru
    eco2Buffer[avgIndex] = eco2;        // Simpan eCO2 terbaru
    dustBuffer[avgIndex] = dust;        // simpan nilai debu terbaru ke buffer

    avgIndex++;                         // Pindah ke posisi buffer berikutnya
    if (avgIndex >= AVG_WINDOW) {       // Jika sudah mencapai batas
      avgIndex = 0;                     // Kembali ke awal
      bufferFilled = true;              // Tandai bahwa buffer sudah penuh
    }

    // --- Hitung rata-rata dari data yang tersimpan ---
    float avgT   = averageFloat(tempBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgTVOC = averageInt(tvocBuffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgECO2 = averageInt(eco2Buffer, bufferFilled ? AVG_WINDOW : avgIndex);
    float avgDust = averageFloat(dustBuffer, bufferFilled ? AVG_WINDOW : avgIndex); // hitung rata-rata debu


    // --- Perbarui tampilan dengan data terbaru ---
    update_display(avgT, h, aqi, (int)avgTVOC, (int)avgECO2, avgDust);  // tampilkan rata-rata debu

    // Paksa LVGL melakukan refresh tampilan sekarang juga
    lv_refr_now(NULL);
  }
}

// ------------------- UI Creation -------------------
// Fungsi untuk membuat seluruh tampilan antarmuka di layar
void ui_create() {
  lv_obj_t *scr = lv_scr_act();  // Ambil layar utama LVGL
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0a0e27), 0);          // Warna latar belakang utama
  lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x1a1f3a), 0);     // Gradasi warna atas-bawah
  lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);              // Arah gradasi vertikal

  // -------- Header / Judul --------
  lv_obj_t *status_bar = lv_obj_create(scr);                          // Buat area bar atas
  lv_obj_set_size(status_bar, 320, 30);                               // Ukuran bar 320x30
  lv_obj_align(status_bar, LV_ALIGN_TOP_MID, 0, 0);                   // Posisikan di atas
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x1e2640), 0);   // Warna bar
  lv_obj_set_style_border_width(status_bar, 0, 0);                    // Hilangkan garis pinggir

  lv_obj_t *title = lv_label_create(status_bar);                      // Tambahkan teks judul
  lv_label_set_text(title, "AIR QUALITY MONITOR");                    // Isi teks judul
  lv_obj_set_style_text_color(title, lv_color_white(), 0);            // Warna teks putih
  lv_obj_align(title, LV_ALIGN_CENTER, 0, 0);                         // Letakkan di tengah bar

  // -------- Tampilan AQI (Arc) --------
  lv_obj_t *aqi_container = lv_obj_create(scr);                       // Buat wadah untuk AQI
  lv_obj_set_size(aqi_container, 130, 140);                           // Ukuran kontainer AQI
  lv_obj_align(aqi_container, LV_ALIGN_LEFT_MID, 5, 10);              // Posisikan di kiri tengah
  lv_obj_set_style_bg_color(aqi_container, lv_color_hex(0x1e2640), 0);// Warna latar AQI
  lv_obj_set_style_border_width(aqi_container, 2, 0);                 // Garis pinggir tipis

  arc_aqi = lv_arc_create(aqi_container);                             // Buat lingkaran indikator AQI
  lv_obj_set_size(arc_aqi, 100, 100);                                 // Ukuran lingkaran
  lv_obj_align(arc_aqi, LV_ALIGN_CENTER, 0, -5);                      // Posisikan di tengah
  lv_arc_set_rotation(arc_aqi, 135);                                  // Putaran awal
  lv_arc_set_bg_angles(arc_aqi, 0, 270);                              // Rentang sudut 270 derajat
  lv_arc_set_value(arc_aqi, 0);                                       // Nilai awal 0
  lv_obj_clear_flag(arc_aqi, LV_OBJ_FLAG_CLICKABLE);                  // Biar gak bisa diklik

  label_aqi_val = lv_label_create(aqi_container);                     // Teks angka AQI
  lv_label_set_text(label_aqi_val, "0");
  lv_obj_set_style_text_color(label_aqi_val, lv_color_white(), 0);
  lv_obj_align(label_aqi_val, LV_ALIGN_CENTER, 0, -15);
  lv_obj_set_style_transform_scale(label_aqi_val, 300, 0);            // Perbesar teks AQI

  lv_obj_t *lbl_aqi_txt = lv_label_create(aqi_container);             // Label tulisan “AQI”
  lv_label_set_text(lbl_aqi_txt, "AQI");
  lv_obj_set_style_text_color(lbl_aqi_txt, lv_color_hex(0x8b92a8), 0);
  lv_obj_align(lbl_aqi_txt, LV_ALIGN_CENTER, 0, 15);

  label_aqi_status = lv_label_create(aqi_container);                  // Label status (GOOD, BAD, dll)
  lv_label_set_text(label_aqi_status, "---");
  lv_obj_align(label_aqi_status, LV_ALIGN_BOTTOM_MID, 0, -5);

  // -------- Kartu sensor lainnya --------
  int card_w = 85, card_h = 60, start_x = 145, start_y = 40, gap = 8; // Ukuran & posisi kartu

  lv_obj_t *card_temp = create_card(scr, "TEMP", lv_color_hex(0xff6b6b), start_x, start_y, card_w, card_h);
  label_temp_val = lv_label_create(card_temp);                        // Label suhu
  lv_label_set_text(label_temp_val, "-- °C");
  lv_obj_align(label_temp_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_hum = create_card(scr, "HUM", lv_color_hex(0x4ecdc4), start_x + card_w + gap, start_y, card_w, card_h);
  label_hum_val = lv_label_create(card_hum);                          // Label kelembapan
  lv_label_set_text(label_hum_val, "-- %");
  lv_obj_align(label_hum_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_tvoc = create_card(scr, "TVOC", lv_color_hex(0xf9ca24), start_x, start_y + card_h + gap, card_w, card_h);
  label_tvoc_val = lv_label_create(card_tvoc);                        // Label TVOC
  lv_label_set_text(label_tvoc_val, "-- ppb");
  lv_obj_align(label_tvoc_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_co2 = create_card(scr, "eCO2", lv_color_hex(0xa29bfe), start_x + card_w + gap, start_y + card_h + gap, card_w, card_h);
  label_co2_val = lv_label_create(card_co2);                          // Label eCO2
  lv_label_set_text(label_co2_val, "-- ppm");
  lv_obj_align(label_co2_val, LV_ALIGN_CENTER, 0, 5);

  lv_obj_t *card_dust = create_card(scr, "DUST", lv_color_hex(0xfd79a8), start_x, start_y + 2 * (card_h + gap), card_w * 2 + gap, card_h);
  label_dust_val = lv_label_create(card_dust);                        // Label debu
  lv_label_set_text(label_dust_val, "-- ug/m3");
  lv_obj_align(label_dust_val, LV_ALIGN_CENTER, 0, 5);
}

// ------------------- CARD TEMPLATE -------------------
// Fungsi untuk membuat tampilan kartu kecil di UI (untuk suhu, kelembapan, dll)
lv_obj_t* create_card(lv_obj_t *parent, const char *title, lv_color_t bg_color, int x, int y, int w, int h) {
  lv_obj_t *card = lv_obj_create(parent);                     // Buat objek kartu baru
  lv_obj_set_size(card, w, h);                                // Atur ukuran kartu
  lv_obj_set_pos(card, x, y);                                 // Atur posisi kartu di layar
  lv_obj_set_style_bg_color(card, bg_color, 0);               // Warna latar belakang
  lv_obj_set_style_border_width(card, 0, 0);                  // Hilangkan border
  lv_obj_set_style_radius(card, 12, 0);                       // Buat sudut kartu melengkung
  lv_obj_set_style_pad_all(card, 5, 0);                       // Tambahkan jarak di dalam kartu

  lv_obj_t *lbl_title = lv_label_create(card);                // Buat label judul kartu (contoh: "TEMP")
  lv_label_set_text(lbl_title, title);
  lv_obj_set_style_text_color(lbl_title, lv_color_white(), 0);
  lv_obj_align(lbl_title, LV_ALIGN_TOP_LEFT, 3, 2);           // Posisikan judul di kiri atas
  return card;                                                // Kembalikan objek kartu
}

// ------------------- UPDATE DISPLAY -------------------
// Fungsi untuk memperbarui tampilan nilai sensor dan status AQI
void update_display(float t, float h, int aqi, int tvoc, int eco2, float dust) {
  static char buf[32];                                       // Buffer teks sementara

  // --- Perbarui nilai di layar ---
  sprintf(buf, "%.1f °C", t); lv_label_set_text(label_temp_val, buf);     // Suhu
  sprintf(buf, "%.0f %%", h); lv_label_set_text(label_hum_val, buf);      // Kelembapan
  sprintf(buf, "%d ppb", tvoc); lv_label_set_text(label_tvoc_val, buf);   // TVOC
  sprintf(buf, "%d ppm", eco2); lv_label_set_text(label_co2_val, buf);    // eCO2
  sprintf(buf, "%.1f ug/m3", dust); lv_label_set_text(label_dust_val, buf); // Debu

  // --- Update tampilan AQI ---
  int aqi_clamped = constrain(aqi, 1, 5);                    // Pastikan AQI tetap antara 1–5
  int arc_val = map(aqi_clamped, 1, 5, 0, 100);              // Konversi ke 0–100 untuk grafik
  lv_arc_set_value(arc_aqi, arc_val);                        // Tampilkan di grafik

  sprintf(buf, "%d", aqi);                                   // Tampilkan angka AQI
  lv_label_set_text(label_aqi_val, buf);

  const char *status;                                        // Status teks AQI
  lv_color_t color;                                          // Warna sesuai kondisi udara

  // --- Tentukan status berdasarkan AQI ---
  switch (aqi_clamped) {
    case 1: status = "GOOD"; color = lv_color_hex(0x00ff88); break;
    case 2: status = "MODERATE"; color = lv_color_hex(0xffeb3b); break;
    case 3: status = "UNHEALTHY"; color = lv_color_hex(0xff9800); break;
    case 4: status = "VERY UNHEALTHY"; color = lv_color_hex(0xff5722); break;
    case 5: status = "HAZARDOUS"; color = lv_color_hex(0xff1744); break;
    default: status = "---"; color = lv_color_hex(0xcccccc); break;
  }

  // --- Terapkan warna & teks ke tampilan AQI ---
  lv_label_set_text(label_aqi_status, status);               // Tampilkan teks status
  lv_obj_set_style_text_color(label_aqi_status, color, 0);   // Warna teks status
  lv_obj_set_style_arc_color(arc_aqi, color, LV_PART_INDICATOR); // Warna indikator
  lv_obj_set_style_text_color(label_aqi_val, color, 0);      // Warna angka AQI

  // --- Cetak ke Serial Monitor ---
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
