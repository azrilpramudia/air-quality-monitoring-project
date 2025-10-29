/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import mqtt from "mqtt";
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
import SensorDetail from "../SensorDetail/SensorDetail.jsx";
import AQIModal from "../Modals/AQIModal.jsx";
import SensorChartModal from "../Modals/SensorChartModal.jsx";
import { herostyles as styles } from "../../styles/Hero.Styles.js";
import { getAQIInfo } from "../../utils/getAQIInfo.js";

import { motion, AnimatePresence } from "framer-motion";
const pageMotionProps = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.5, ease: "easeOut" },
};

import { Toaster, toast } from "react-hot-toast";

const THRESHOLDS = {
  dust: 500, // µg/m³ -> ganti ke 500 kalau mau
  aqi: 4, // level
};

// 1 toast saja untuk semua alert kualitas udara
const AIR_ALERT_ID = "air-alert";

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

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // === MQTT ===
  useEffect(() => {
    const MQTT_BROKER =
      import.meta.env.VITE_MQTT_URL || "wss://broker.emqx.io:8084/mqtt";
    const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC || "air/quality";

    const client = mqtt.connect(MQTT_BROKER, {
      clientId: "react_dashboard_" + Math.random().toString(16).slice(2, 8),
      reconnectPeriod: 3000,
      clean: true,
    });

    client.on("connect", () => {
      setIsConnected(true);
      client.subscribe(
        MQTT_TOPIC,
        (err) => !err && console.log("📡 Subscribed:", MQTT_TOPIC)
      );
    });

    client.on("message", (_topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const mapped = {
          aqi: Number(data.aqi ?? 0),
          temperature: Number(data.temp ?? 0),
          humidity: Number(data.hum ?? 0),
          tvoc: Number(data.tvoc ?? 0),
          eco2: Number(data.eco2 ?? 0),
          dust: Number(data.dust ?? 0),
        };
        setSensorData(mapped);

        // ====== Logika NOTIF: satu toast custom, isi 2 kartu (Dust & AQI) berdampingan ======
        // ====== Logika NOTIF: notifikasi elegan & compact ======
        const highDust = mapped.dust > THRESHOLDS.dust;
        const highAQI = mapped.aqi >= THRESHOLDS.aqi;

        if (highDust || highAQI) {
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                } transition-all duration-300`}
              >
                <div
                  className="glass-effect rounded-lg shadow-lg border border-slate-600/40"
                  style={{ maxWidth: 420 }}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Icon & Status */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center border border-rose-500/30">
                          <span className="text-lg">⚠️</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-sm font-bold text-white">
                            Peringatan Kualitas Udara
                          </h4>
                          <button
                            onClick={() => toast.dismiss(AIR_ALERT_ID)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Alert Items - Compact */}
                        <div className="space-y-2">
                          {highDust && (
                            <div className="flex items-center justify-between bg-slate-800/40 rounded-md px-2.5 py-1.5 border border-rose-500/20">
                              <div className="flex items-center gap-2">
                                <span className="text-base">💨</span>
                                <div>
                                  <p className="text-xs font-semibold text-white">
                                    Debu Tinggi
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Gunakan masker
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-rose-400">
                                  {mapped.dust}
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  µg/m³
                                </p>
                              </div>
                            </div>
                          )}

                          {highAQI && (
                            <div className="flex items-center justify-between bg-slate-800/40 rounded-md px-2.5 py-1.5 border border-amber-500/20">
                              <div className="flex items-center gap-2">
                                <span className="text-base">😷</span>
                                <div>
                                  <p className="text-xs font-semibold text-white">
                                    AQI Tinggi
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Batasi aktivitas
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-amber-400">
                                  Level {mapped.aqi}
                                </p>
                                <p className="text-[9px] text-slate-500">AQI</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                            Pembaruan real-time
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
            {
              id: AIR_ALERT_ID,
              duration: Infinity,
              position: "top-center",
            }
          );
        } else {
          // Langsung hilangkan notifikasi saat nilai normal
          toast.dismiss(AIR_ALERT_ID);
        }
        // ====================================================================
        // ====================================================================
      } catch (e) {
        console.error("⚠️ Invalid MQTT JSON:", message.toString());
      }
    });

    client.on("error", (err) => {
      console.error("🚨 MQTT Error:", err.message);
      setIsConnected(false);
    });

    client.on("close", () => {
      setIsConnected(false);
    });

    return () => client.end();
  }, []);

  // Mini hash-router
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
  const openChartModal = (type, value, icon, color) =>
    setChartModal({
      isOpen: true,
      sensorType: type,
      currentValue: value,
      icon,
      color,
    });
  const closeChartModal = () =>
    setChartModal({
      isOpen: false,
      sensorType: null,
      currentValue: null,
      icon: null,
      color: null,
    });

  const aqiInfo = getAQIInfo(sensorData.aqi);

  if (currentView === "detail" && selectedSensor) {
    return (
      <motion.div {...pageMotionProps}>
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ zIndex: 999999 }}
          toastOptions={{
            style: {
              background: "rgba(15,23,42,0.92)",
              color: "#fff",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "12px",
            },
          }}
        />
        <SensorDetail
          sensorType={selectedSensor}
          onBack={handleBackToDashboard}
        />
      </motion.div>
    );
  }

  return (
    <>
      <style>{styles}</style>

      {/* Toaster global */}
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: {
            background: "rgba(15,23,42,0.92)",
            color: "#fff",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "12px",
          },
        }}
      />

      {/* ====== UI Lainnya (tetap seperti punyamu) ====== */}
      <motion.div
        {...pageMotionProps}
        id="hero-root"
        className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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

          {/* AQI Display */}
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

          {/* Info Cards */}
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

          {/* Sensor Cards */}
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

          {/* AQI Scale */}
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
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showAQIModal && (
          <motion.div
            key="aqi-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AQIModal
              isOpen={showAQIModal}
              onClose={closeAQIModal}
              level={selectedAQILevel}
              aqiInfo={selectedAQILevel ? getAQIInfo(selectedAQILevel) : null}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chartModal.isOpen && (
          <motion.div
            key="chart-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SensorChartModal
              isOpen={chartModal.isOpen}
              onClose={closeChartModal}
              sensorType={chartModal.sensorType}
              currentValue={chartModal.currentValue}
              icon={chartModal.icon}
              color={chartModal.color}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
