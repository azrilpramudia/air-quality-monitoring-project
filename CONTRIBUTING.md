# 🤝 Contributing Guide  
Thank you for your interest in contributing to the **Air Quality Monitoring** project!  
This project is collaboratively developed by **three contributors**:  
- [@azrilpramudia](https://github.com/azrilpramudia)  
- [@prawira26](https://github.com/prawira26)  
- [@miraaldina](https://github.com/miraaldina)  

---

## 🧠 Project Overview
**Air Quality Monitoring** is an IoT-based project that measures air quality parameters such as temperature, humidity, dust concentration, and gas levels using:
- **ESP32**
- **ENS160 (Air Quality Sensor)**
- **SHT31 (Temperature & Humidity Sensor)**
- **GP2Y1010AU0F (Dust Sensor)**
- **ILI9431 (TFT Display)**

The system displays real-time data locally and supports integration with cloud or mobile dashboards.

---

## 🪜 Contribution Steps

### 1. Fork and Clone the Repository
```bash
git clone https://github.com/<your-username>/Air-Quality-Monitoring.git
cd Air-Quality-Monitoring
```

### 2. Create a New Branch
Name your branch according to the feature or fix you’re working on:
```bash
git checkout -b feature/your-feature-add
# or
git checkout -b fix/your-fix-add
```

### 3. Make Your Changes
- Write clean, well-documented code.  
- Use meaningful commit messages.  
- Follow consistent indentation and naming style.  

### 4. Commit and Push
```bash
git add .
git commit -m "Add LVGL UI for air quality data"
git push origin feature/add-lvgl-ui
```

### 5. Create a Pull Request (PR)
- Open a pull request (PR) to the `main` branch.  
- Clearly describe what you changed or fixed.  
- Assign reviewers if needed (Azril, Prawira, Miraaldina).  

---

## 🧩 Code Style Guidelines
- Use clear and descriptive variable names.  
- Add comments for complex logic or sensor calibration steps.  
- Keep code modular — separate UI logic, sensor readings, and networking.  
- Prefer English for code comments.  

Example:
```cpp
// ✅ Good
float temperature = sht31.readTemperature();

// ❌ Bad
float t = sht31.rt();
```

---

## 🧪 Testing Guidelines
Before submitting:
1. Ensure the ESP32 boots without error.  
2. Test all connected sensors for correct readings.  
3. Verify LVGL display updates properly.  
4. If connected to a dashboard, confirm data is transmitted correctly.  

## 💬 Need Help?
If you encounter any issues or have questions about contribution guidelines, feel free to open a discussion or contact one of the maintainers via GitHub.

Happy coding! ✨  
**— Air Quality Monitoring Team**
