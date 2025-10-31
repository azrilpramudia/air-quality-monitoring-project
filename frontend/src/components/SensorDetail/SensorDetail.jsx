// /* eslint-disable no-unused-vars */
import React, { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Activity, Info, TrendingUp } from "lucide-react";
import SensorChartModal from "../Modals/SensorChartModal.jsx";
import { styles } from "../../styles/SensorDetail.Styles.js";
import { useMQTT } from "../../hooks/useMQTT.js";

const SensorDetail = ({ sensorType, onBack }) => {
  const { data: mqttData, isConnected, activeBroker } = useMQTT();
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    sensorType: null,
    currentValue: null,
    icon: null,
    color: null,
  });

  // Scroll to top on mount
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (chartModal.isOpen) {
      document.body.style.overflow = "hidden";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [chartModal.isOpen]);

  const openChartModal = (type, value, icon, color) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setChartModal({
      isOpen: true,
      sensorType: type,
      currentValue: value,
      icon,
      color,
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

  // ================= SENSOR INFO =================
  const sensorInfo = {
    SHT31: {
      name: "SHT31",
      fullName: "Sensirion SHT31 Digital Sensor",
      color: "from-blue-500 to-blue-600",
      description: `SHT31 adalah sensor digital berukuran kecil yang dirancang untuk mengukur suhu dan kelembapan udara secara akurat dalam satu chip.`,
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
        "Sensor GP2Y1010AU0F mendeteksi konsentrasi partikel debu menggunakan sistem optik LED IR dan fototransistor.",
      specs: [
        { label: "Tegangan suplai", value: "5 V ±0,5 V" },
        { label: "Sensitivitas", value: "0.5V per 0.1mg/m³" },
        { label: "Arus konsumsi", value: "20 mA" },
        { label: "Rentang suhu operasi", value: "-10 °C hingga +65 °C" },
      ],
      applications: ["Air Purifier", "Air Conditioner", "Air Quality Monitor"],
    },
    ENS160: {
      name: "ENS160",
      fullName: "ScioSense ENS160 Air Quality Sensor",
      color: "from-green-500 to-teal-600",
      description:
        "ENS160 adalah sensor multi-gas digital yang mendeteksi TVOC, eCO₂, dan AQI secara real time.",
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

  const info = sensorInfo[sensorType];
  if (!info) {
    onBack?.();
    return null;
  }

  // ================= CURRENT DATA =================
  const currentData = mqttData || {};

  return (
    <>
      <style>{styles}</style>

      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onBack}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Kembali ke Dashboard</span>
            </button>
          </div>

          {/* Title */}
          <div
            className={`relative overflow-hidden bg-gradient-to-r ${info.color} rounded-3xl p-8 mb-8 shadow-2xl border border-white/10`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex items-center justify-between flex-wrap">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {info.name}
                </h1>
                <p className="text-white/90 text-lg font-medium">
                  {info.fullName}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/30 shadow-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-bold text-white">
                  {isConnected ? "LIVE DATA" : "DISCONNECTED"}
                </span>
              </div>
            </div>

            {/* Broker info */}
            {activeBroker && (
              <p className="text-xs mt-2 text-white/70">
                Broker:{" "}
                <span className="text-cyan-300">
                  {new URL(activeBroker).hostname}
                </span>
              </p>
            )}
          </div>

          {/* Current Data */}
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-8 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-cyan-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Data Real-Time
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {sensorType === "SHT31" && (
                <>
                  <DataCard
                    label="Temperature"
                    value={`${currentData.temperature ?? "--"}°C`}
                    icon="🌡️"
                    color="cyan"
                    onClick={() =>
                      openChartModal(
                        "temperature",
                        `${currentData.temperature ?? "--"}°C`,
                        "🌡️",
                        "from-yellow-500 to-orange-500"
                      )
                    }
                  />
                  <DataCard
                    label="Humidity"
                    value={`${currentData.humidity ?? "--"}%`}
                    icon="💧"
                    color="blue"
                    onClick={() =>
                      openChartModal(
                        "humidity",
                        `${currentData.humidity ?? "--"}%`,
                        "💧",
                        "from-blue-500 to-cyan-500"
                      )
                    }
                  />
                </>
              )}
              {sensorType === "GP2Y1010AU0F" && (
                <DataCard
                  label="Dust Concentration"
                  value={`${currentData.dust ?? "--"} µg/m³`}
                  icon="💨"
                  color="purple"
                  onClick={() =>
                    openChartModal(
                      "dust",
                      `${currentData.dust ?? "--"} µg/m³`,
                      "💨",
                      "from-slate-500 to-slate-600"
                    )
                  }
                />
              )}
              {sensorType === "ENS160" && (
                <>
                  <DataCard
                    label="TVOC"
                    value={`${currentData.tvoc ?? "--"} ppb`}
                    icon="🌿"
                    color="green"
                    onClick={() =>
                      openChartModal(
                        "tvoc",
                        `${currentData.tvoc ?? "--"} ppb`,
                        "🌿",
                        "from-cyan-500 to-teal-500"
                      )
                    }
                  />
                  <DataCard
                    label="eCO₂"
                    value={`${currentData.eco2 ?? "--"} ppm`}
                    icon="🌍"
                    color="teal"
                    onClick={() =>
                      openChartModal(
                        "eco2",
                        `${currentData.eco2 ?? "--"} ppm`,
                        "🌍",
                        "from-purple-500 to-pink-500"
                      )
                    }
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Chart */}
      {chartModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeChartModal}
            />
            <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-auto">
              <SensorChartModal
                isOpen={chartModal.isOpen}
                onClose={closeChartModal}
                sensorType={chartModal.sensorType}
                currentValue={chartModal.currentValue}
                icon={chartModal.icon}
                color={chartModal.color}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const DataCard = ({ label, value, icon, color = "cyan", onClick }) => {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 group-hover:border-cyan-400/50",
    blue: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 group-hover:border-blue-400/50",
    purple:
      "from-purple-500/20 to-pink-500/20 border-purple-500/30 group-hover:border-purple-400/50",
    green:
      "from-green-500/20 to-emerald-500/20 border-green-500/30 group-hover:border-green-400/50",
    teal: "from-teal-500/20 to-cyan-500/20 border-teal-500/30 group-hover:border-teal-400/50",
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
            {label}
          </p>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-3xl font-black tracking-tight text-white drop-shadow-lg mb-2">
          {value}
        </p>
        <div className="flex items-center space-x-1 text-xs text-cyan-400 group-hover:text-cyan-300">
          <TrendingUp className="h-3 w-3" />
          <span>Lihat Grafik</span>
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;
