/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useRealtimeSensor } from "../../hooks/useRealtimeSensor";

const CustomTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{data.time}</p>
        <p className="text-base font-bold text-white">
          {data.value} <span className="text-xs text-slate-400">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PredictionChart = ({ type, title, unit, color, icon, mlOnline }) => {
  const [rawData, setRawData] = useState([]);
  const scrollRef = useRef(null);

  const { data: sensorData } = useRealtimeSensor();

  const liveValue =
    type === "temperature"
      ? sensorData?.temperature
      : type === "tvoc"
      ? sensorData?.tvoc
      : null;

  const pendingRef = useRef(false);

  const fetchPrediction = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;

    try {
      const res = await fetch(
        `http://localhost:5000/api/predict/chart/${type}`
      );
      const json = await res.json();

      if (json?.data) {
        setRawData(json.data);
      }
    } catch (err) {
      console.error("Prediction fetch error:", err);
    } finally {
      setTimeout(() => {
        pendingRef.current = false;
      }, 1500);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [type]);

  useEffect(() => {
    if (liveValue == null) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setRawData((prev) => {
      const historical = prev.filter((d) => d.type === "actual");
      const predicted = prev.filter((d) => d.type === "predicted");

      const updatedHistorical = [
        ...historical,
        { time: timeLabel, value: liveValue, type: "actual" },
      ].filter((item, index, arr) => {
        if (index === 0) return true;
        return item.value !== arr[index - 1].value;
      });

      const slicedHistorical = updatedHistorical.slice(-48);

      return [...slicedHistorical, ...predicted];
    });
  }, [liveValue, type]);

  const hasData = rawData.length > 0;

  const historicalData = rawData.filter((d) => d.type === "actual");
  let predictedData = rawData.filter((d) => d.type === "predicted");

  // sambungkan garis actual -> predicted (only if ML is ON)
  if (mlOnline && historicalData.length > 0 && predictedData.length > 0) {
    const lastActual = historicalData[historicalData.length - 1];
    if (predictedData[0]?.time !== lastActual.time) {
      predictedData.unshift(lastActual);
    }
  }

  const currentValue =
    liveValue ??
    historicalData[historicalData.length - 1]?.value ??
    predictedData[0]?.value ??
    0;

  const yAxisDomain = type === "temperature" ? [10, 45] : [100, 2000];

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* HEADER */}
      <div className="p-5 pb-4 border-b border-slate-700/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
              }}
            >
              {icon}
            </div>

            <div className="text-left">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">{dateStr}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-cyan-400 font-medium">
                  {timeStr}
                </span>
              </div>
            </div>
          </div>

          {/* VALUE */}
          <div className="text-left flex flex-col items-start">
            <div className="text-4xl font-black text-white leading-none mb-1">
              {currentValue}
            </div>
            <p className="text-xs text-slate-400">{unit}</p>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#475569 rgba(15, 23, 42, 0.5)",
          }}
        >
          <div
            style={{ width: "200%", minWidth: "800px" }}
            className="p-5 pt-6 pb-2"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={rawData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id={`gradient-${type}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(100, 116, 139, 0.15)"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  type="category"
                  allowDuplicatedCategory={false}
                  stroke="rgba(148, 163, 184, 0.3)"
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  interval={0}
                />

                <YAxis
                  stroke="rgba(148, 163, 184, 0.3)"
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  width={45}
                  domain={yAxisDomain}
                />

                <Tooltip content={<CustomTooltip unit={unit} />} />

                {/* DATA AKTUAL */}
                <Line
                  data={historicalData}
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={3}
                  dot={{ fill: color, r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />

                {/* PREDICTION — ONLY IF ML ACTIVE */}
                {mlOnline && predictedData.length > 0 && (
                  <Line
                    data={predictedData}
                    type="monotone"
                    dataKey="value"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: "#F59E0B", r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
          ← Geser untuk melihat →
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-5 pb-4 pt-3 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-400 font-medium">Data Aktual</span>
            </div>

            {/* LEGEND PREDIKSI — ONLY IF ML ACTIVE */}
            {mlOnline && (
              <div className="flex items-center gap-2">
                <svg width="32" height="4" viewBox="0 0 32 4">
                  <line
                    x1="0"
                    y1="2"
                    x2="32"
                    y2="2"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                </svg>
                <span className="text-slate-400 font-medium">Prediksi AI</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PredictionCharts = () => {
  const [mlOnline, setMlOnline] = useState(null);

  // 🔥 FIXED — VALID ML STATUS FETCHER
  const fetchMLStatus = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/predict/chart/temperature"
      );
      const json = await res.json();
      setMlOnline(json?.mlOnline);
    } catch (err) {
      setMlOnline(false);
    }
  };

  useEffect(() => {
    fetchMLStatus();
    const interval = setInterval(fetchMLStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl animate-slide-in mb-8"
      style={{ animationDelay: "0.35s" }}
    >
      {/* ML STATUS BADGE */}
      <div className="flex justify-center mb-4">
        {mlOnline === null ? (
          <span className="px-4 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
            Checking ML service...
          </span>
        ) : mlOnline ? (
          <span className="px-4 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            AI Prediction Online
          </span>
        ) : (
          <span className="px-4 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            AI Prediction Offline
          </span>
        )}
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Prediksi Kualitas Udara
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm px-4">
          Analisis prediktif berbasis AI untuk membantu Anda merencanakan
          aktivitas berdasarkan kondisi udara masa depan
        </p>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictionChart
          type="temperature"
          title="Suhu"
          unit="°C"
          color="#06B6D4"
          icon="🌡️"
          mlOnline={mlOnline}
        />

        <PredictionChart
          type="tvoc"
          title="TVOC"
          unit="ppb"
          color="#06B6D4"
          icon="🌊"
          mlOnline={mlOnline}
        />
      </div>
    </div>
  );
};

export default PredictionCharts;
