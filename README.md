# 🌫️ Air Quality Monitoring System

**Air Quality Monitoring System** is designed to monitor air quality in real time using an **ESP32** microcontroller and key sensors such as **ENS160**, **SHT31**, and **GP2Y1010AU0F**, with live data displayed on an **ILI9431 TFT screen**.

---

## 📦 Components

| Component        | Function                      | Description                                               |
| ---------------- | ----------------------------- | --------------------------------------------------------- |
| **ESP32**        | Main microcontroller          | Collects sensor data and displays results                 |
| **ENS160**       | Digital air quality sensor    | Measures VOC, eCO₂, and AQI (Air Quality Index)           |
| **SHT31-D**      | Temperature & humidity sensor | Provides temperature and humidity compensation for ENS160 |
| **GP2Y1010AU0F** | Dust/particulate sensor       | Measures dust concentration in the air                    |
| **ILI9431**      | TFT Display 2.4"/2.8"/3.2"    | Displays real-time sensor readings                        |

---

## 📺 Live Dashboard Demo (Frontend)

A modern web dashboard built with **React + WebSockets + MQTT** shows:

- 📊 Real-time sensor charts  
- 🧠 AI-powered prediction for Temperature & TVOC  
- 🟢 Online/Offline device status  
- 📥 Exportable historical data  
- 🎨 Beautiful glassmorphism UI  

### 🔗 Live Dashboard Preview

https://air-quality-monitoring-dusky.vercel.app

If running locally:

http://localhost:5173

## 🤖 AI Prediction System

This project includes an **AI forecasting module** built with Python **FastAPI** and **XGBoost Multi-Output Regression**.

### What AI Predicts

- Temperature
- TVOC (ppb)

## Example Images
![Preview](/media/images/website.png)
![Preview](/media/images/website2.png)
![Preview](/media/images/website3.png)

---

### Workflow

ESP32 → MQTT → Node.js Backend → ML Worker → FastAPI → Prediction → Dashboard

---

## ⚙️ Features

- 🔹 Real-time monitoring (AQI, TVOC, eCO₂, Temp, Humidity, Dust)
- 🌡️ Live compensation between ENS160 & SHT31
- 🖥️ Beautiful real-time TFT display
- 🔄 Continuous auto-refresh
- 🤖 AI prediction system
- 📊 Historical trends & analytics
- 📤 Excel export support
- ☁️ (Optional) Cloud/MQTT dashboard

---

## 📊 System Diagram

```
[ENS160]──┐
           │
[SHT31]────┼──(I2C Bus)──► [ESP32] ──► [ILI9431 Display]
           │
[GP2Y1010AU0F]──(Analog Input)
```

---

## 💻 Required Libraries

Make sure the following libraries are installed in **Arduino IDE** or **PlatformIO**:

```cpp
#include <Wire.h>
#include "ScioSense_ENS160.h"
#include <GP2YDustSensor.h>
#include "Adafruit_SHT31.h"
#include <TFT_eSPI.h>
#include <SPI.h>
#include <lvgl.h>
```

> ⚠️ **Note:** Ensure that the `User_Setup.h` configuration file in the `TFT_eSPI` library matches your specific ILI9431 model.

---

## 🧠 How It Works

1. **Sensor Initialization** – ESP32 initializes ENS160, SHT31, and GP2Y1010AU0F.  
2. **Data Reading** – Each sensor sends measured data (VOC, eCO₂, temperature, humidity, dust).  
3. **Data Compensation** – ENS160 uses temperature & humidity data from SHT31 for accurate calibration.  
4. **Display Output** – All values are shown on the ILI9431 screen using `LVGL` or `TFT_eSPI`.  
5. _(Optional)_ **Cloud Upload** – Data can be uploaded via Wi-Fi to Firebase or MQTT servers.  

---

## 📷 Example Display

![Preview](/media/images/AQI.jpg)

---

## 🔌 Wiring Overview

| Component    | ESP32 Pin                                                | Description  |
| ------------ | -------------------------------------------------------- | ------------ |
| ENS160       | SDA → 21, SCL → 22                                       | I2C          |
| SHT31        | SDA → 21, SCL → 22                                       | I2C          |
| GP2Y1010AU0F | LED → 12, Vo → 34                                        | Analog input |
| ILI9431      | MOSI → 23, MISO → 19, SCK → 18, CS → 15, DC → 2, RST → 4 | SPI display  |

---

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/<username>/Air-Quality-Monitoring.git
   cd Air-Quality-Monitoring
   ```
2. Open the project in **Arduino IDE** or **PlatformIO**
3. Install all required libraries
4. Connect your ESP32 and upload the code
5. Observe sensor readings on the TFT or Serial Monitor

---

## 🔐 .env_example

If you are integrating this system with a **web dashboard** or **MQTT broker**, create a `.env` file in your frontend project root (for example, Vite or React project) and copy the template below:

```bash
# MQTT Configuration Example
VITE_MQTT_URL=
VITE_MQTT_TOPIC=
VITE_MQTT_CLIENT_PREFIX=
VITE_MQTT_DEBUG=
```

> 💡 Example:
> ```
> VITE_MQTT_URL=wss://broker.emqx.io:8084/mqtt
> VITE_MQTT_TOPIC=esp32/airquality
> VITE_MQTT_CLIENT_PREFIX=react_client_
> VITE_MQTT_DEBUG=true
> ```

---

## ⭐ Support

If you find this project helpful, please consider giving it a ⭐ on GitHub to support further development!
