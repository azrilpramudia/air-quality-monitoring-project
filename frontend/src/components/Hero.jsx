/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Cloud,
  Droplets,
  Wind,
  Sun,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import SensorDetail from "./SensorDetail.jsx";
import AQIModal from "./AQIModal.jsx";
import SensorChartModal from "./SensorChartModal.jsx";

// Improved CSS animations - lebih smooth dan konsisten
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
    50% { box-shadow: 0 0 35px rgba(6, 182, 212, 0.5); }
  }

  @keyframes slide-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-float { animation: float 3.5s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  .animate-slide-in { animation: slide-in 0.5s ease-out; animation-fill-mode: both; }
  .animate-fade-in { animation: fade-in 0.6s ease-out; }

  .glass-effect {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  .gradient-text {
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const Hero = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showAQIModal, setShowAQIModal] = useState(false);
  const [selectedAQILevel, setSelectedAQILevel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
  });
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    sensorType: null,
    currentValue: null,
    icon: null,
    color: null,
  });

  // Update waktu tiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hubungkan ke MQTT Broker
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL ?? "wss://broker.emqx.io:8084/mqtt";
        const res = await fetch(`${API_URL}/data`);
        const data = await res.json();
        setSensorData(data);
      } catch (error) {
        console.error("Gagal memuat data sensor:", error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const h = (window.location.hash || "").toLowerCase();
      const map = {
        "#sht31": "SHT31",
        "#gp2y": "GP2Y1010AU0F",
        "#ens160": "ENS160",
      };

      if (map[h]) {
        setSelectedSensor(map[h]);
        setCurrentView("detail");
      } else if (h === "#top" || h === "#home" || h === "" || h === "#") {
        setCurrentView("dashboard");
        document
          .getElementById("hero-top")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const getAQIInfo = (aqi) => {
    if (aqi <= 1)
      return {
        color: "from-green-400 to-emerald-500",
        bgGlow: "shadow-green-500/30",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-400",
        label: "Baik",
        desc: "Udara bersih dan sehat untuk aktivitas luar ruangan.",
        level: 1,
        emoji: "😊",
      };
    if (aqi <= 2)
      return {
        color: "from-yellow-400 to-amber-500",
        bgGlow: "shadow-yellow-500/30",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-400",
        label: "Sedang",
        desc: "Kualitas udara masih dapat diterima dengan baik.",
        level: 2,
        emoji: "🙂",
      };
    if (aqi <= 3)
      return {
        color: "from-orange-400 to-orange-500",
        bgGlow: "shadow-orange-500/30",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-400",
        label: "Tidak Sehat",
        desc: "Kurang baik untuk kelompok sensitif seperti anak-anak.",
        level: 3,
        emoji: "😐",
      };
    if (aqi <= 4)
      return {
        color: "from-red-500 to-rose-600",
        bgGlow: "shadow-red-500/30",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-400",
        label: "Sangat Tidak Sehat",
        desc: "Berisiko bagi semua kelompok, batasi aktivitas luar.",
        level: 4,
        emoji: "😷",
      };
    return {
      color: "from-purple-500 to-fuchsia-600",
      bgGlow: "shadow-purple-500/30",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      label: "Berbahaya",
      desc: "Darurat kesehatan! Hindari aktivitas luar ruangan.",
      level: 5,
      emoji: "⚠️",
    };
  };

  const handleSensorClick = (sensorType) => {
    setSelectedSensor(sensorType);
    setCurrentView("detail");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedSensor(null);
    window.location.hash = "#top";
    document
      .getElementById("hero-top")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAQIClick = (level) => {
    setSelectedAQILevel(level);
    setShowAQIModal(true);
  };

  const closeAQIModal = () => {
    setShowAQIModal(false);
    setSelectedAQILevel(null);
  };

  const openChartModal = (type, value, icon, color) => {
    setChartModal({
      isOpen: true,
      sensorType: type,
      currentValue: value,
      icon: icon,
      color: color,
    });
  };

  const closeChartModal = () => {
    setChartModal({
      isOpen: false,
      sensorType: null,
      currentValue: null,
      icon: null,
      color: null,
    });
  };

  const aqiInfo = getAQIInfo(sensorData.aqi);

  if (currentView === "detail" && selectedSensor) {
    return (
      <SensorDetail
        sensorType={selectedSensor}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div
        id="hero-root"
        className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden"
      >
        {/* Animated Background Elements - Simplified */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header - Improved spacing */}
          <div
            id="hero-top"
            className="text-center mb-10 sm:mb-14 animate-fade-in"
          >
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 tracking-wider">
                REAL-TIME MONITORING
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">
              Indeks Kualitas Udara
            </h1>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4">
              Pemantauan kualitas udara dan parameter lingkungan secara
              real-time dengan teknologi sensor terkini
            </p>
          </div>

          {/* AQI Display - Better proportions */}
          <div className="flex flex-col items-center justify-center mb-12 sm:mb-16 animate-slide-in">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${aqiInfo.color} opacity-20 blur-2xl animate-pulse`}
              ></div>
              <div
                onClick={() => handleAQIClick(aqiInfo.level)}
                className={`group relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${aqiInfo.color} shadow-2xl ${aqiInfo.bgGlow} transition-all duration-500 animate-float cursor-pointer hover:scale-105`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-inner"></div>
                <div className="absolute inset-[10px] rounded-full bg-gradient-to-b from-slate-900 to-slate-800"></div>
                <div className="relative z-10 text-center">
                  <div className="text-4xl sm:text-5xl mb-2">
                    {aqiInfo.emoji}
                  </div>
                  <p className="text-6xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-2xl tracking-tighter">
                    {sensorData.aqi ?? "--"}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-2 tracking-wide">
                    {aqiInfo.label}
                  </p>
                  <p className="text-xs text-cyan-400 mt-2 opacity-70 md:opacity-0 transition-all duration-300 md:group-hover:opacity-100 md:group-hover:text-cyan-300">
                    Klik untuk info lengkap
                  </p>
                </div>
              </div>
            </div>

            <div
              className="glass-effect rounded-2xl p-5 mt-8 max-w-md mx-auto shadow-xl animate-slide-in"
              style={{ animationDelay: "0.1s" }}
            >
              <p className="text-slate-300 text-center text-sm leading-relaxed">
                {aqiInfo.desc}
              </p>
            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 animate-slide-in px-4"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-full">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  Bandung, Jawa Barat
                </span>
              </div>
              <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  {currentTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  WIB
                </span>
              </div>
            </div>
          </div>

          {/* Info Cards - Better mobile layout */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 sm:mb-12 animate-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            <EnhancedInfoCard
              icon={<Sun className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />}
              title="Suhu"
              value={`${sensorData.temperature ?? "--"}°C`}
              subtitle="Cerah sebagian"
              color="from-yellow-500/20 to-orange-500/20"
              onClick={() =>
                openChartModal(
                  "temperature",
                  `${sensorData.temperature ?? "--"}°C`,
                  "🌡️",
                  "from-yellow-500 to-orange-500"
                )
              }
            />
            <EnhancedInfoCard
              icon={
                <Droplets className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
              }
              title="Kelembapan"
              value={`${sensorData.humidity ?? "--"}%`}
              subtitle="Normal"
              color="from-blue-500/20 to-cyan-500/20"
              onClick={() =>
                openChartModal(
                  "humidity",
                  `${sensorData.humidity ?? "--"}%`,
                  "💧",
                  "from-blue-500 to-cyan-500"
                )
              }
            />
            <EnhancedInfoCard
              icon={<Wind className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />}
              title="TVOC"
              value={`${sensorData.tvoc ?? "--"} ppb`}
              subtitle="Kualitas udara"
              color="from-cyan-500/20 to-teal-500/20"
              onClick={() =>
                openChartModal(
                  "tvoc",
                  `${sensorData.tvoc ?? "--"} ppb`,
                  "🌿",
                  "from-cyan-500 to-teal-500"
                )
              }
            />
            <EnhancedInfoCard
              icon={<Cloud className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />}
              title="eCO₂"
              value={`${sensorData.eco2 ?? "--"} ppm`}
              subtitle="Karbon dioksida"
              color="from-purple-500/20 to-pink-500/20"
              onClick={() =>
                openChartModal(
                  "eco2",
                  `${sensorData.eco2 ?? "--"} ppm`,
                  "🌍",
                  "from-purple-500 to-pink-500"
                )
              }
            />
            <EnhancedInfoCard
              icon={
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />
              }
              title="Dust"
              value={`${sensorData.dust ?? "--"} µg/m³`}
              subtitle="Partikel debu"
              color="from-slate-500/20 to-slate-600/20"
              onClick={() =>
                openChartModal(
                  "dust",
                  `${sensorData.dust ?? "--"} µg/m³`,
                  "💨",
                  "from-slate-500 to-slate-600"
                )
              }
            />
          </div>

          {/* Sensor Cards - Better alignment */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-10 sm:mb-12 animate-slide-in"
            style={{ animationDelay: "0.25s" }}
          >
            {[
              {
                type: "SHT31",
                title: "SHT31",
                desc: "Sensor Suhu & Kelembapan",
                color: "from-blue-500 to-blue-600",
                icon: "🌡️",
                data: [
                  {
                    label: "Temperature",
                    value: `${sensorData.temperature ?? "--"}°C`,
                    icon: "🌡️",
                  },
                  {
                    label: "Humidity",
                    value: `${sensorData.humidity ?? "--"}%`,
                    icon: "💧",
                  },
                ],
              },
              {
                type: "GP2Y1010AU0F",
                title: "GP2Y1010AU0F",
                desc: "Sensor Debu & Partikel",
                color: "from-purple-500 to-purple-600",
                icon: "💨",
                data: [
                  {
                    label: "Dust",
                    value: `${sensorData.dust ?? "--"} µg/m³`,
                    icon: "💨",
                  },
                ],
              },
              {
                type: "ENS160",
                title: "ENS160",
                desc: "Sensor Kualitas Udara",
                color: "from-green-500 to-teal-600",
                icon: "🌿",
                data: [
                  {
                    label: "VOC",
                    value: `${sensorData.tvoc ?? "--"} ppb`,
                    icon: "🌿",
                  },
                  {
                    label: "eCO₂",
                    value: `${sensorData.eco2 ?? "--"} ppm`,
                    icon: "🌍",
                  },
                ],
              },
            ].map((sensor, i) => (
              <div
                key={i}
                onClick={() => handleSensorClick(sensor.type)}
                className="group relative glass-effect rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-slate-700/50 hover:border-cyan-500/50 flex flex-col"
              >
                {/* Gradient Header */}
                <div
                  className={`relative bg-gradient-to-r ${sensor.color} p-5 sm:p-6 text-white overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl sm:text-3xl">
                          {sensor.icon}
                        </span>
                        <h4 className="text-lg sm:text-xl font-bold">
                          {sensor.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-white/30">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold">LIVE</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-white/90 font-medium">
                      {sensor.desc}
                    </p>
                  </div>
                </div>

                {/* Data Display */}
                <div className="p-5 sm:p-6 space-y-3 bg-gradient-to-b from-slate-900/40 to-slate-800/40 flex-1">
                  {sensor.data.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-800/60 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg sm:text-xl">{d.icon}</span>
                        <span className="text-xs sm:text-sm text-slate-300 font-medium">
                          {d.label}
                        </span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-white">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 pb-4 sm:pb-5 bg-gradient-to-b from-slate-800/40 to-slate-900/60">
                  <div className="flex items-center justify-center space-x-2 text-cyan-400 transition-all duration-300 group-hover:text-cyan-300">
                    <span className="text-xs sm:text-sm font-semibold tracking-wide">
                      Lihat Detail
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AQI Scale - Better mobile grid */}
          <div
            className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl animate-slide-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
                Skala Indeks Kualitas Udara
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm px-4">
                Panduan memahami tingkat kualitas udara berdasarkan konsentrasi
                polutan
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                {
                  level: "1",
                  emoji: "😊",
                  label: "Baik",
                  desc: "Udara bersih dan sehat",
                  color: "from-green-400 to-emerald-500",
                },
                {
                  level: "2",
                  emoji: "🙂",
                  label: "Sedang",
                  desc: "Masih dapat diterima",
                  color: "from-yellow-400 to-amber-500",
                },
                {
                  level: "3",
                  emoji: "😐",
                  label: "Tidak Sehat",
                  desc: "Kurang baik untuk sensitif",
                  color: "from-orange-400 to-orange-500",
                },
                {
                  level: "4",
                  emoji: "😷",
                  label: "Sangat Tidak Sehat",
                  desc: "Berisiko bagi semua",
                  color: "from-red-500 to-rose-600",
                },
                {
                  level: "5",
                  emoji: "⚠️",
                  label: "Berbahaya",
                  desc: "Darurat kesehatan",
                  color: "from-purple-500 to-fuchsia-600",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleAQIClick(parseInt(item.level))}
                  className={`relative group bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl"></div>
                  <div className="relative z-10">
                    <div className="text-3xl sm:text-4xl mb-2">
                      {item.emoji}
                    </div>
                    <div className="text-xl sm:text-2xl font-black mb-1">
                      {item.level}
                    </div>
                    <p className="text-sm sm:text-base font-bold mb-1">
                      {item.label}
                    </p>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-center space-x-1 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400 group-hover:text-cyan-300">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-semibold tracking-wide">
                        Lihat Detail
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 text-center px-4">
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto">
                Skala AQI (Air Quality Index) mengklasifikasikan kualitas udara
                dari level 1 (Baik) hingga 5 (Berbahaya). Semakin tinggi nilai
                AQI, semakin buruk kualitas udara dan semakin besar risiko
                kesehatan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AQIModal
        isOpen={showAQIModal}
        onClose={closeAQIModal}
        level={selectedAQILevel}
        aqiInfo={selectedAQILevel ? getAQIInfo(selectedAQILevel) : null}
      />

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

const EnhancedInfoCard = ({ icon, title, value, subtitle, color, onClick }) => (
  <div
    onClick={onClick}
    className={`group glass-effect rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer`}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity blur-xl`}
    ></div>
    <div className="relative z-10">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
        <div className={`p-2 bg-gradient-to-br ${color} rounded-xl`}>
          {icon}
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
          {title}
        </p>
      </div>
      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
        {value}
      </p>
      <p className="text-xs text-slate-400 font-medium mb-2">{subtitle}</p>
      <div className="flex items-center space-x-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrendingUp className="h-3 w-3" />
        <span>Lihat Grafik</span>
      </div>
    </div>
  </div>
);

export default Hero;
