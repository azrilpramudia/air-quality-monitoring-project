export const sensorInfo = {
    SHT31: {
      name: "SHT31",
      fullName: "Sensirion SHT31 Digital Sensor",
      color: "from-blue-500 to-blue-600",
      description:
        "SHT31 adalah sensor digital berukuran kecil yang dirancang untuk mengukur suhu dan kelembapan udara secara akurat dalam satu chip. Sensor ini menggunakan antarmuka I²C dan memiliki waktu respons yang cepat serta stabilitas jangka panjang yang baik. Dengan akurasi tinggi, sensor ini cocok untuk berbagai aplikasi lingkungan dan IoT.",
      specs: [
        { label: "Range Suhu", value: "-40°C hingga +125°C" },
        { label: "Akurasi Suhu", value: "±0,3°C (typical)" },
        { label: "Akurasi Kelembapan", value: "±2% RH (typical)" },
        { label: "Tegangan Kerja", value: "2,5 V - 5 V" },
        { label: "Interface", value: "I²C (alamat 0x44/0x45)" },
      ],
      applications: [
        "Pemantauan lingkungan",
        "Smart home & IoT",
        "HVAC system",
        "Inkubator",
      ],
    },
    GP2Y1010AU0F: {
      name: "GP2Y1010AU0F",
      fullName: "Sharp GP2Y1010AU0F Dust Sensor",
      color: "from-purple-500 to-purple-600",
      description:
        "GP2Y1010AU0F adalah sensor optik dari Sharp yang mendeteksi konsentrasi partikel debu di udara menggunakan LED inframerah dan fototransistor. Sensor ini menghasilkan tegangan analog yang berbanding lurus dengan jumlah partikel debu yang terdeteksi. Biasanya digunakan dalam sistem pemurni udara, pengkondisi udara, dan pemantauan kualitas udara.",
      specs: [
        { label: "Tegangan Suplai", value: "5 V ±0,5 V" },
        { label: "Sensitivitas", value: "0.5V per 0.1mg/m³" },
        { label: "Arus Konsumsi", value: "20 mA" },
        { label: "Rentang Suhu Operasi", value: "-10 °C hingga +65 °C" },
      ],
      applications: ["Air Purifier", "Air Conditioner", "Air Quality Monitor"],
    },
    ENS160: {
      name: "ENS160",
      fullName: "ScioSense ENS160 Air Quality Sensor",
      color: "from-green-500 to-teal-600",
      description:
        "ENS160 adalah sensor multi-gas digital dari ScioSense yang dirancang untuk mendeteksi kualitas udara dalam ruangan secara real-time. Sensor ini dapat mengukur berbagai gas seperti TVOC (Total Volatile Organic Compounds), eCO₂ (equivalent CO₂), serta memberikan nilai AQI (Air Quality Index). ENS160 dilengkapi dengan algoritma internal yang mampu melakukan kompensasi suhu dan kelembapan, sehingga hasil pembacaan lebih akurat dan stabil.",
      specs: [
        { label: "Tegangan Catu Daya", value: "1,8 V (typical)" },
        { label: "Interface", value: "I²C (alamat 0x52/0x53)" },
        {
          label: "Output",
          value: "TVOC (0–65.000 ppb), eCO₂ (400–65.000 ppm), AQI (1–5)",
        },
        { label: "Konsumsi Arus", value: "±24 mA" },
      ],
      applications: [
        "Air Purifier",
        "Smart Home",
        "IoT Monitoring",
        "Deteksi Polusi",
      ],
    },
  };