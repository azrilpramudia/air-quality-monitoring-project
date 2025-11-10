/* eslint-disable no-unused-vars */
// /* eslint-disable no-unused-vars */
import { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Activity, TrendingUp } from "lucide-react";
import SensorChartModal from "../Modals/SensorChartModal.jsx";
import { styles } from "../../styles/SensorDetail.Styles.js";
import { useMQTT } from "../../hooks/useMQTT.js";
import { sensorInfo } from "../../data/sensorInfo.js";
import { motion } from "framer-motion";

const SensorDetail = ({ sensorType, onBack }) => {
  const { data: mqttData, isConnected } = useMQTT();
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
        {/* Background */}
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
                    label="Suhu"
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
                    label="Kelembapan"
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
                  label="Konsentrasi Debu"
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

          {/* Sensor Description Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 md:p-10 mb-10 border border-slate-700/60 shadow-[0_0_30px_-5px_rgba(0,255,255,0.15)] transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(0,255,255,0.25)]"
          >
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight relative inline-block"
            >
              Tentang Sensor
              {/* Glowing Line Under Title */}
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                viewport={{ once: true }}
                className="absolute -bottom-2 left-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-transparent rounded-full"
              ></motion.span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-slate-300 leading-relaxed mb-10 text-justify"
            >
              {info.description}
            </motion.p>

            {/* Grid Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Specification Technical */}
              <motion.div
                whileHover={{ scale: 1.02, borderColor: "#06b6d4" }}
                transition={{ duration: 0.3 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner transition-all duration-300"
              >
                <h3 className="text-2xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  Spesifikasi Teknis
                </h3>
                <ul className="space-y-3">
                  {info.specs.map((spec, index) => (
                    <li
                      key={index}
                      className="flex justify-between text-slate-300 border-b border-slate-700/50 pb-2 text-sm md:text-base"
                    >
                      <span className="font-medium text-slate-200">
                        {spec.label}
                      </span>
                      <span className="text-slate-100 font-light">
                        {spec.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Common Application */}
              <motion.div
                whileHover={{ scale: 1.02, borderColor: "#10b981" }}
                transition={{ duration: 0.3 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-inner transition-all duration-300"
              >
                <h3 className="text-2xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Aplikasi Umum
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm md:text-base leading-relaxed">
                  {info.applications.map((app, index) => (
                    <li key={index}>{app}</li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </motion.section>
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
