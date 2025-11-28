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

// Generate data 24 jam ke depan mulai dari 00:00
const generatePredictionData = (type) => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const timeLabel = `${i.toString().padStart(2, "0")}:00`;

    if (type === "temperature") {
      const baseTemp = 27;
      const variation = Math.sin((i / 24) * Math.PI * 2) * 8;
      const randomNoise = (Math.random() - 0.5) * 2;
      const value = Math.max(
        10,
        Math.min(45, baseTemp + variation + randomNoise)
      );

      data.push({
        time: timeLabel,
        value: Number(value.toFixed(1)),
        type: i <= now.getHours() ? "actual" : "predicted",
      });
    } else {
      const baseTVOC = 600;
      const variation = Math.sin((i / 24) * Math.PI * 2) * 300;
      const randomNoise = (Math.random() - 0.5) * 100;
      const value = Math.max(
        100,
        Math.min(2000, baseTVOC + variation + randomNoise)
      );

      data.push({
        time: timeLabel,
        value: Math.round(value),
        type: i <= now.getHours() ? "actual" : "predicted",
      });
    }
  }

  return data;
};

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

const PredictionChart = ({ type, title, unit, color, icon }) => {
  const [data, setData] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setData(generatePredictionData(type));
  }, [type]);

  if (!data.length) return null;

  const currentValue = data.find((d) => d.type === "actual")?.value || 0;

  const historicalData = data.filter((d) => d.type === "actual");
  const predictedData = data.filter((d) => d.type === "predicted");

  if (historicalData.length > 0 && predictedData.length > 0) {
    predictedData.unshift(historicalData[historicalData.length - 1]);
  }

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
      {/* HEADER — SUDAH RATA KIRI */}
      <div className="p-5 pb-4 border-b border-slate-700/30">
        <div className="flex items-start justify-between">
          {/* Left Section */}
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
                <span className="text-xs font-medium text-cyan-400">
                  {timeStr}
                </span>
              </div>
            </div>
          </div>

          {/* VALUE - RATA KIRI */}
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
              <LineChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
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
                  data={data}
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

                {/* GARIS HISTORIS */}
                <Line
                  data={historicalData}
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={3}
                  dot={{ fill: color, r: 4, strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    fill: color,
                    strokeWidth: 2,
                    stroke: "#0f172a",
                  }}
                  isAnimationActive={false}
                />

                {/* GARIS AI PREDIKSI */}
                <Line
                  data={predictedData}
                  type="monotone"
                  dataKey="value"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ fill: "#F59E0B", r: 4, strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    fill: "#F59E0B",
                    strokeWidth: 2,
                    stroke: "#0f172a",
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scroll Indicator */}
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
              ></div>
              <span className="text-slate-400 font-medium">Data Aktual</span>
            </div>
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
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PredictionCharts = () => {
  return (
    <div className="glass-effect rounded-2xl sm:rounded-3xl p-10 sm:p-8 md:p-10 shadow-2xl animate-slide-in sm:mb-8">
      {/* HEADER UTAMA */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
          Prediksi Kualitas Udara
        </h2>

        <p className="text-slate-400 text-sm mb-3">
          Timeline 24 jam – geser grafik untuk melihat detail prediksi
        </p>

        {/* BADGE BARU */}
        <div
          className="
            inline-flex items-center gap-2
            px-4 py-1.5 rounded-full
            bg-gradient-to-r from-purple-600/20 via-fuchsia-500/20 to-pink-500/20
            border border-purple-400/40
            shadow-[0_0_12px_rgba(168,85,247,0.25)]
            backdrop-blur-sm
          "
        >
          <span className="text-sm">🤖</span>
          <span className="text-[11px] font-semibold text-purple-300">
            AI Prediction
          </span>
          <span className="text-[10px] text-purple-300/50">•</span>
          <span className="text-[11px] text-purple-200/80">
            Machine Learning
          </span>
        </div>
      </div>

      {/* GRID CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictionChart
          type="temperature"
          title="Suhu"
          unit="°C"
          color="#06B6D4"
          icon="🌡️"
        />

        <PredictionChart
          type="tvoc"
          title="TVOC"
          unit="ppb"
          color="#06B6D4"
          icon="🌊"
        />
      </div>
    </div>
  );
};

export default PredictionCharts;
