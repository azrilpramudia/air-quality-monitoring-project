/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// ====== Motion Config ======
const pageMotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const Hero = () => {
  // 🔄 Realtime data
  const { data: sensorData } = useRealtimeContext();

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

  // === Scroll to Top on Load ===
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
    const hashMap = {
      SHT31: "#sht31",
      GP2Y1010AU0F: "#gp2y",
      ENS160: "#ens160",
    };

    window.location.hash = hashMap[sensorType] || "#top";
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
      <motion.div {...pageMotionProps} key="detail-view">
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

      <motion.div
        {...pageMotionProps}
        key="dashboard-view"
        id="hero-root"
        className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100 overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 -left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10"
          />
          <motion.div
            className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
          {/* Header */}
          <div id="hero-top" className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
              Indeks Kualitas Udara
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Pemantauan kualitas udara dan parameter lingkungan secara real-time
            </p>
          </div>

          {/* AQI Circle */}
          <AQICircleDisplay
            aqiInfo={aqiInfo}
            sensorData={sensorData}
            currentTime={currentTime}
            onClick={handleAQIClick}
          />

          {/* Sensor Cards */}
          <SensorCardsGrid
            sensorData={sensorData}
            onOpenChart={openChartModal}
            handleSensorClick={handleSensorClick}
          />

          {/* AQI Scale */}
          <div className="my-12">
            <AQIScale onClick={handleAQIClick} />
          </div>

          {/* Prediction */}
          <PredictionCharts />
        </div>
      </motion.div>

      {/* AQI Modal */}
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
              aqiInfo={
                selectedAQILevel
                  ? getAQIInfo(selectedAQILevel)
                  : null
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Modal */}
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
