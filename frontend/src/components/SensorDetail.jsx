import React, { useState, useEffect } from "react";
import { ArrowLeft, Activity, Info, Calendar, TrendingUp } from "lucide-react";
import SensorChartModal from "./SensorChartModal";

// Custom CSS animations
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }

  .animate-slide-up {
    animation: slide-up 0.6s ease-out;
    animation-fill-mode: both;
  }
`;

const SensorDetail = ({ sensorType, onBack }) => {
  const [currentData, setCurrentData] = useState({});
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    sensorType: null,
    currentValue: null,
    icon: null,
    color: null
  });

  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const res = await fetch("http://192.168.1.10:5000/data");
        const data = await res.json();
        setCurrentData(data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    };

    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 3000);
    return () => clearInterval(interval);
  }, []);

  const openChartModal = (type, value, icon, color) => {
    setChartModal({
      isOpen: true,
      sensorType: type,
      currentValue: value,
      icon: icon,
      color: color
    });
  };

  const closeChartModal = () => {
    setChartModal({
      isOpen: false,
      sensorType: null,
      currentValue: null,
      icon: null,
      color: null
    });
  };

  const sensorInfo = {
    SHT31: {
      name: "SHT31",
      fullName: "Sensirion SHT31 Digital Sensor",
      color: "from-blue-500 to-blue-600",
      description: `SHT31 adalah sensor digital berukuran kecil yang dirancang untuk mengukur suhu dan kelembapan udara secara akurat dalam satu chip. Sensor ini sudah terkalibrasi pabrik, sehingga dapat langsung digunakan tanpa proses kalibrasi tambahan. Data dibaca melalui antarmuka I²C (alamat umum 0x44/0x45), dengan tegangan kerja fleksibel 2,15–5,5 V sehingga cocok untuk mikrokontroler seperti ESP32.
                    SHT31 juga menyediakan mode pembacaan sekali atau berkala, dilengkapi CRC untuk memastikan data tidak korup, dan heater internal opsional untuk mengurangi kondensasi. Berkat kemudahan integrasi dan kestabilannya, SHT31 banyak dipakai pada stasiun cuaca mini, smart home/IoT, HVAC, serta untuk kompensasi suhu/kelembapan pada sensor kualitas udara lainnya.`,
      specs: [
        { label: "Range Suhu", value: "-40°C hingga +125°C" },
        { label: "Akurasi Suhu", value: "±0,3°C (typical)" },
        { label: "Akurasi Kelembapan", value: "±2% RH (typical)" },
        { label: "Tegangan Kerja", value: "2,5 V - 5 V (breakout)" },
        { label: "Interface", value: "I²C (alamat 0x44 default, 0x45 opsional)" },
        { label: "Waktu Respons (RH, t₆₃%)", value: "< 8 detik" },
      ],
      applications: [
        "Pemantauan lingkungan dan cuaca",
        "Sistem Pengontrol Suhu dan Kelembapan",
        "Inkubator dan ruang kendali suhu",
        "Smart home & IoT",
        "Perangkat industri dan otomasi",
        "Smart home & IoT"
      ],
    },
    GP2Y1010AU0F: {
      name: "GP2Y1010AU0F",
      fullName: "Sharp GP2Y1010AU0F Dust Sensor",
      color: "from-purple-500 to-purple-600",
      description:
        `Sensor GP2Y1010AU0F adalah sensor debu optik buatan Sharp yang dirancang untuk mendeteksi konsentrasi partikel debu di udara, 
        termasuk asap rokok dan debu rumah tangga. Sensor ini menggunakan sistem optik yang terdiri dari LED inframerah (IRED) dan 
        fototransistor yang dipasang secara diagonal di dalam ruang deteksi. Cara kerjanya adalah ketika LED IR menyala, cahaya yang 
        dipancarkan akan terhambur (scattered) oleh partikel debu yang melintas di udara. Cahaya pantulan tersebut diterima oleh fototransistor, 
        lalu diubah menjadi sinyal tegangan analog (Vo). Semakin banyak partikel di udara, semakin besar cahaya yang terpantul, dan semakin tinggi tegangan output yang dihasilkan. 
        Nilai tegangan ini berbanding lurus dengan konsentrasi debu dalam satuan mg/m³. Sensor ini sangat efektif untuk mendeteksi partikel halus seperti asap rokok, 
        dan bahkan dapat membedakan antara debu rumah tangga dan asap berdasarkan pola pulsa pada output tegangannya.`,
      specs: [
        { label: "Tegangan suplai", value: "VCC = 5 V ±0,5 V" },
        { label: "Sensitivitas", value: "0.5V per 0.1mg/m³" },
        { label: "Arus konsumsi maksimum", value: "20 mA" },
        { label: "Rentang suhu operasi", value: "-10 °C hingga +65 °C" },
        { label: "Tegangan output tanpa debu (Vo)", value: "sekitar 0,9 V (tipikal)" },
        { label: "Dimensi fisik", value: "< 46,0 x 30,0 x 17,6 mm" },
      ],
      applications: [
        "Air Purifier (Pembersih Udara)",
        "Air Conditioner (Pendingin Udara)",
        "Air Quality Monitor (Pemantau Kualitas Udara)",
      ],
    },
    ENS160: {
      name: "ENS160",
      fullName: "ScioSense ENS160 Air Quality Sensor",
      color: "from-green-500 to-teal-600",
      description:
        `Sensor ENS160 adalah multi-gas digital air quality sensor yang digunakan untuk mendeteksi dan memantau kualitas udara dalam ruangan secara real time. Sensor ini mampu mengukur Total Volatile Organic Compounds (TVOC), konsentrasi CO₂ ekuivalen (eCO₂), 
        serta menghitung Air Quality Index (AQI) berdasarkan berbagai standar internasional. ENS160 dirancang menggunakan teknologi metal oxide (MOX) dengan sistem kompensasi suhu dan kelembapan internal, yang membuatnya akurat bahkan pada kondisi lingkungan 
        yang berubah-ubah. Sensor ini dapat diintegrasikan melalui antarmuka komunikasi I²C atau SPI, memudahkan penggunaan pada berbagai jenis mikrokontroler dan sistem tertanam.`,
      specs: [
        { label: "Tegangan Catu Daya (VDD)", value: "1,71 V - 1,98 V (tipikal 1,8 V)" },
        { label: "Antarmuka Komunikasi", value: "I²C (alamat I²C 0x52/0x53)" },
        { label: "Sinyal Keluaran", value: "TVOC (0-65.000 ppb), eCO₂ (400-65.000 ppm), AQI (1-5)" },
        { label: "Konsumsi Arus", value: "±24 mA pada mode operasi standar" },
        { label: "Rentang Operasi", value: "Suhu -5 °C - 60 °C, Kelembapan 20 - 80 % RH (non-kondensasi)" },
        { label: "Ukuran Paket", value: "3,0 x 3,0 x 0,9 mm (LGA 9-pin)" },
      ],
      applications: [
        "Air Purifier (Pembersih Udara)",
        "Air Quality Monitor (Pemantau Kualitas Udara)",
        "Perangkat IoT dan Rumah Pintar (Smart Home)",
        "Deteksi polusi udara",
        "Sistem peringatan dini",
        "Smart HVAC"
      ],
    },
  };

  const info = sensorInfo[sensorType];

  // Jika sensorType tidak valid -> kembali ke dashboard dan hentikan render
  if (!info) {
    onBack?.();
    return null;
  }

  return (
    <>
      <style>{styles}</style>
      {/* Background dengan animated gradient */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Header dengan animasi */}
          <div className="mb-8 animate-fade-in">
            <button
              onClick={onBack}
              className="group inline-flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-300 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md shadow-lg hover:shadow-cyan-500/20 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-semibold">Kembali ke Dashboard</span>
            </button>
          </div>

          {/* Title Card dengan glassmorphism dan animasi */}
          <div className={`relative overflow-hidden bg-gradient-to-r ${info.color} rounded-3xl p-8 mb-8 shadow-2xl border border-white/10 animate-slide-up`}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow-lg">
                  {info.name}
                </h1>
                <p className="text-white/90 text-lg font-medium">{info.fullName}</p>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-sm font-bold text-white tracking-wide">LIVE DATA</span>
              </div>
            </div>
          </div>

          {/* Current Data dengan card yang lebih menarik */}
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-8 border border-slate-700/50 shadow-2xl animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                  <Activity className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Data Real-Time</h2>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-300">Update setiap 3 detik</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {sensorType === "SHT31" && (
                <>
                  <DataCard 
                    label="Temperature" 
                    value={`${currentData.temperature || "--"}°C`} 
                    icon="🌡️" 
                    color="cyan"
                    onClick={() => openChartModal('temperature', `${currentData.temperature || "--"}°C`, '🌡️', 'from-yellow-500 to-orange-500')}
                  />
                  <DataCard 
                    label="Humidity" 
                    value={`${currentData.humidity || "--"}%`} 
                    icon="💧" 
                    color="blue"
                    onClick={() => openChartModal('humidity', `${currentData.humidity || "--"}%`, '💧', 'from-blue-500 to-cyan-500')}
                  />
                </>
              )}
              {sensorType === "GP2Y1010AU0F" && (
                <DataCard 
                  label="Dust Concentration" 
                  value={`${currentData.dust || "--"} µg/m³`} 
                  icon="💨" 
                  color="purple"
                  onClick={() => openChartModal('dust', `${currentData.dust || "--"} µg/m³`, '💨', 'from-slate-500 to-slate-600')}
                />
              )}
              {sensorType === "ENS160" && (
                <>
                  <DataCard 
                    label="TVOC" 
                    value={`${currentData.tvoc || "--"} ppb`} 
                    icon="🌿" 
                    color="green"
                    onClick={() => openChartModal('tvoc', `${currentData.tvoc || "--"} ppb`, '🌿', 'from-cyan-500 to-teal-500')}
                  />
                  <DataCard 
                    label="eCO₂" 
                    value={`${currentData.eco2 || "--"} ppm`} 
                    icon="🌍" 
                    color="teal"
                    onClick={() => openChartModal('eco2', `${currentData.eco2 || "--"} ppm`, '🌍', 'from-purple-500 to-pink-500')}
                  />
                </>
              )}
            </div>
          </section>

          {/* Sensor Information dengan layout lebih menarik */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-700/50 shadow-2xl animate-slide-up hover:border-cyan-500/30 transition-all duration-300" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                  <Info className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Tentang Sensor</h2>
              </div>
              <p
                className="text-slate-300 text-[15px] leading-relaxed text-justify tracking-wide"
                style={{ textAlign: "justify", textJustify: "inter-word" }}
              >
                {info.description}
              </p>
            </section>

            <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-700/50 shadow-2xl animate-slide-up hover:border-cyan-500/30 transition-all duration-300" style={{animationDelay: '0.35s'}}>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-5">Spesifikasi Teknis</h2>
              <div className="space-y-3">
                {info.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all duration-300 group"
                  >
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{spec.label}</span>
                    <span className="text-sm font-bold text-white bg-slate-700/50 px-3 py-1 rounded-lg">{spec.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Applications dengan grid card yang lebih menarik */}
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-700/50 shadow-2xl animate-slide-up" style={{animationDelay: '0.4s'}}>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Aplikasi dan Penggunaan</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {info.applications.map((app, i) => (
                <div
                  key={i}
                  className="group relative bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform"></div>
                    <p className="text-slate-200 group-hover:text-white transition-colors leading-relaxed">{app}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Chart Modal */}
      <SensorChartModal
        isOpen={chartModal.isOpen}
        onClose={closeChartModal}
        sensorType={chartModal.sensorType}
        currentValue={chartModal.currentValue}
        icon={chartModal.icon}
        color={chartModal.color}
      />
    </>
  );
};

const DataCard = ({ label, value, icon, color = "cyan", onClick }) => {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 group-hover:border-cyan-400/50",
    blue: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 group-hover:border-blue-400/50",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30 group-hover:border-purple-400/50",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30 group-hover:border-green-400/50",
    teal: "from-teal-500/20 to-cyan-500/20 border-teal-500/30 group-hover:border-teal-400/50"
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}
    >
      {/* Decorative glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</p>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-3xl font-black tracking-tight text-white drop-shadow-lg mb-2">{value}</p>
        <div className="flex items-center space-x-1 text-xs text-cyan-400 group-hover:text-cyan-300">
          <TrendingUp className="h-3 w-3" />
          <span>Lihat Grafik</span>
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;