/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useRealtimeContext } from "../../context/RealtimeContext.jsx";

// ====== Components ======
import AQICircleDisplay from "./AQICircleDisplay.jsx";
import PredictionCharts from "./PredictionCharts";
import SensorCardsGrid from "./SensorCardsGrid.jsx";
import AQIScale from "./AQIScale.jsx";
import SensorDetail from "../SensorDetail/SensorDetail.jsx";
import AQIModal from "../Modals/AQIModal.jsx";
import SensorChartModal from "../Modals/SensorChartModal.jsx";

// ====== Styles & Utils ======
import { herostyles as styles } from "../../styles/Hero.Styles.js";
import { getAQIInfo } from "../../utils/getAQIInfo.js";

// ====== Constants ======
const pageMotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }, // Custom easing for smoother animation
};

const THRESHOLDS = {
  dust: 500,
  aqi: 4,
};

const AIR_ALERT_ID = "air-alert";

const Hero = () => {
  // 🔄 Get live data & connection state from context
  const { data: sensorData, connected: isConnected } = useRealtimeContext();

  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showAQIModal, setShowAQIModal] = useState(false);
  const [selectedAQILevel, setSelectedAQILevel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    sensorType: null,
    currentValue: null,
    icon: null,
    color: null,
  });

  // === Time Update ===
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // === Smooth scroll to top on first load ===
  useEffect(() => {
    // Scroll to top smoothly when component first mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // === Alert Toast ===
  useEffect(() => {
    if (!sensorData) return;

    const highDust = sensorData.dust > THRESHOLDS.dust;
    const highAQI = sensorData.aqi >= THRESHOLDS.aqi;

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
            <div className="glass-effect rounded-lg shadow-lg border border-slate-600/40 max-w-md">
              <div className="p-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center border border-rose-500/30">
                    <span className="text-lg">⚠️</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-bold text-white">
                      Peringatan Kualitas Udara
                    </h4>
                    <button
                      onClick={() => toast.dismiss(AIR_ALERT_ID)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ✖
                    </button>
                  </div>

                  {/* Alert Items */}
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
                            {sensorData.dust}
                          </p>
                          <p className="text-[9px] text-slate-500">µg/m³</p>
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
                            Level {sensorData.aqi}
                          </p>
                          <p className="text-[9px] text-slate-500">AQI</p>
                        </div>
                      </div>
                    )}
                  </div>

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
        ),
        { id: AIR_ALERT_ID, duration: Infinity, position: "top-center" }
      );
    } else toast.dismiss(AIR_ALERT_ID);
  }, [sensorData]);

  // === Hash Navigation ===
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
      } else {
        setCurrentView("dashboard");
        document
          .getElementById("hero-top")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // === Handlers ===
  const handleSensorClick = (sensorType) => {
    switch (sensorType) {
      case "SHT31":
        window.location.hash = "#sht31";
        break;
      case "GP2Y1010AU0F":
        window.location.hash = "#gp2y";
        break;
      case "ENS160":
        window.location.hash = "#ens160";
        break;
      default:
        window.location.hash = "#top";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedSensor(null);
    window.location.hash = "#top";
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

  const aqiInfo = getAQIInfo(sensorData?.aqi || 0);

  // === Detail View ===
  if (currentView === "detail" && selectedSensor) {
    return (
      <motion.div 
        {...pageMotionProps}
        key="detail-view"
      >
        <Toaster />
        <SensorDetail
          sensorType={selectedSensor}
          onBack={handleBackToDashboard}
        />
      </motion.div>
    );
  }

  // === Dashboard View ===
  return (
    <>
      <style>{styles}</style>
      <Toaster />
      <motion.div
        {...pageMotionProps}
        key="dashboard-view"
        id="hero-root"
        className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-20 -left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <motion.div 
            id="hero-top" 
            className="text-center mb-10 sm:mb-14"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4">
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
          </motion.div>

          {/* 1. AQI Circle Display */}
          <AQICircleDisplay
            aqiInfo={aqiInfo}
            sensorData={sensorData}
            currentTime={currentTime}
            onClick={handleAQIClick}
          />
          
          {/* 2. Sensor Cards Grid */}
          <SensorCardsGrid
            sensorData={sensorData}
            onOpenChart={openChartModal}
            handleSensorClick={handleSensorClick}
          />
          
          {/* 3. AQI Scale - Pindah ke atas Prediction Charts */}
          <div className="mb-10 sm:mb-12">
            <AQIScale onClick={handleAQIClick} />
          </div>
          
          {/* 4. Prediction Charts - Di paling bawah */}
          <PredictionCharts />
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
            <SensorChartModal {...chartModal} onClose={closeChartModal} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Hero;