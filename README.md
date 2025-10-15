# 🌫️ Air Quality Monitoring System

Sistem **Air Quality Monitoring** ini dirancang untuk memantau kualitas udara secara real-time menggunakan mikrokontroler **ESP32** dan beberapa sensor utama seperti **ENS160**, **SHT31**, dan **GP2Y1010AU0F**, dengan tampilan data pada layar **ILI9431 TFT Display**.

---

## 📦 Daftar Komponen

| Komponen | Fungsi | Keterangan |
|-----------|---------|-------------|
| **ESP32** | Mikrokontroler utama | Mengumpulkan data sensor dan menampilkan hasil |
| **ENS160** | Sensor kualitas udara digital | Mengukur VOC, eCO₂, dan AQI (Air Quality Index) |
| **SHT31-D** | Sensor suhu & kelembapan | Memberikan data kompensasi untuk ENS160 |
| **GP2Y1010AU0F** | Sensor debu (partikulat) | Mengukur konsentrasi debu di udara |
| **ILI9431** | TFT Display 2.4"/2.8"/3.2" | Menampilkan data hasil pengukuran secara real-time |

---

## ⚙️ Fitur Utama

- 🔹 Monitoring kualitas udara (AQI, TVOC, eCO₂)
- 🌡️ Pengukuran suhu dan kelembapan
- 🌫️ Deteksi kadar debu PM (GP2Y1010AU0F)
- 🖥️ Tampilan real-time pada layar TFT (ILI9431)
- 🔄 Pembaruan data otomatis dengan interval tertentu
- 💾 Potensi integrasi ke cloud (Firebase / MQTT / Web Dashboard)

---

## 📊 Diagram Sistem

```
[ENS160]──┐
           │
[SHT31]────┼──(I2C Bus)──► [ESP32] ──► [ILI9431 Display]
           │
[GP2Y1010AU0F]──(Analog Input)
```

---

## 💻 Library yang Digunakan

Pastikan semua library berikut sudah terinstal di **Arduino IDE** atau **PlatformIO**:

```cpp
#include <Wire.h>
#include "ScioSense_ENS160.h"
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"
#include <TFT_eSPI.h>
#include <SPI.h>
#include <lvgl.h>
```

> ⚠️ **Catatan:** Pastikan juga konfigurasi `User_Setup.h` pada library `TFT_eSPI` sudah sesuai dengan model layar ILI9431 yang digunakan.

---

## 🧠 Cara Kerja Singkat

1. **Inisialisasi sensor**: ESP32 mengaktifkan ENS160, SHT31, dan GP2Y1010AU0F.
2. **Pembacaan data**: Setiap sensor mengirimkan nilai hasil pengukuran (VOC, eCO₂, suhu, kelembapan, debu).
3. **Kompensasi data**: ENS160 menggunakan data suhu & kelembapan dari SHT31 untuk kalibrasi akurat.
4. **Tampilan hasil**: Semua data divisualisasikan di layar ILI9431 menggunakan library `LVGL` atau `TFT_eSPI`.
5. *(Opsional)* **Kirim ke Cloud / Dashboard**: Data bisa dikirim ke server menggunakan Wi-Fi ESP32.

---

## 📷 Contoh Tampilan

*(Tambahkan foto atau screenshot di sini)*  
![Preview](images/preview.jpg)

---

## 🔌 Wiring Diagram (Singkat)

| Komponen | Pin ESP32 | Keterangan |
|-----------|-----------|------------|
| ENS160 | SDA → 21, SCL → 22 | I2C |
| SHT31 | SDA → 21, SCL → 22 | I2C |
| GP2Y1010AU0F | LED → 12, Vo → 34 | Analog input |
| ILI9431 | SPI Pins (MOSI → 23, MISO → 19, SCK → 18, CS → 15, DC → 2, RST → 4) | Tampilan TFT |

---

## 🚀 Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/<username>/Air-Quality-Monitoring.git
   cd Air-Quality-Monitoring
   ```
2. Buka proyek di **Arduino IDE** atau **PlatformIO**
3. Pastikan semua library sudah terinstal
4. Hubungkan ESP32 dan upload kode
5. Lihat hasil pembacaan di layar atau di Serial Monitor

---

## 🧩 Rencana Pengembangan

- [ ] Integrasi Firebase / MQTT untuk cloud dashboard  
- [ ] Logging data ke SD Card  
- [ ] Kalibrasi otomatis ENS160  
- [ ] Desain 3D casing proyek  

---

## 🛠️ Lisensi

Proyek ini dirilis di bawah lisensi **MIT License** — silakan gunakan dan modifikasi sesuai kebutuhan.

---

## 👤 Kontributor

azrilpramudia
prawira26
miraaldina

---

## ⭐ Dukungan

Jika proyek ini bermanfaat, berikan ⭐ di repositori ini untuk mendukung pengembangannya!
