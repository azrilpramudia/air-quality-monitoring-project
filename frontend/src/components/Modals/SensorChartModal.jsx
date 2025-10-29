/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { X, TrendingUp, Calendar, Download } from "lucide-react";
import { styles } from "./SensorChartModal.Styles.js";

const SensorChartModal = ({
  isOpen,
  onClose,
  sensorType,
  currentValue,
  icon,
  color,
}) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState("7d"); // 7d, 24h, 30d

  useEffect(() => {
    if (isOpen && sensorType) {
      // Simulasi data historis (replace dengan API call yang sebenarnya)
      generateMockData();
    }
  }, [isOpen, sensorType, timeRange]);

  const generateMockData = () => {
    const days = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic mock data based on sensor type
      let value;
      switch (sensorType) {
        case "temperature":
          value = 25 + Math.random() * 10; // 25-35°C
          break;
        case "humidity":
          value = 50 + Math.random() * 30; // 50-80%
          break;
        case "tvoc":
          value = 100 + Math.random() * 400; // 100-500 ppb
          break;
        case "eco2":
          value = 400 + Math.random() * 600; // 400-1000 ppm
          break;
        case "dust":
          value = 10 + Math.random() * 90; // 10-100 µg/m³
          break;
        default:
          value = Math.random() * 100;
      }

      data.push({
        date: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        time: date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: parseFloat(value.toFixed(2)),
      });
    }

    setChartData(data);
  };

  const getSensorInfo = () => {
    const configs = {
      temperature: {
        title: "Temperature",
        unit: "°C",
        color: "from-yellow-500 to-orange-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        lineColor: "#f59e0b",
      },
      humidity: {
        title: "Humidity",
        unit: "%",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        lineColor: "#3b82f6",
      },
      tvoc: {
        title: "TVOC",
        unit: "ppb",
        color: "from-cyan-500 to-teal-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        lineColor: "#06b6d4",
      },
      eco2: {
        title: "eCO₂",
        unit: "ppm",
        color: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        lineColor: "#a855f7",
      },
      dust: {
        title: "Dust",
        unit: "µg/m³",
        color: "from-slate-500 to-slate-600",
        bgColor: "bg-slate-500/10",
        borderColor: "border-slate-500/30",
        lineColor: "#64748b",
      },
    };

    return configs[sensorType] || configs.temperature;
  };

  const getStatistics = () => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0 };

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return { min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2) };
  };

  if (!isOpen) return null;

  const sensorInfo = getSensorInfo();
  const stats = getStatistics();
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));

  return (
    <>
      <style>{styles}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-4 right-4 float-right z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Modal Content */}
          <div className="p-6 md:p-8">
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${sensorInfo.color} rounded-2xl p-6 mb-6`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">{icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {sensorInfo.title}
                    </h2>
                    <p className="text-white/90 text-lg">
                      Data Historis & Analisis
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm mb-1">Nilai Saat Ini</p>
                  <p className="text-4xl font-black text-white">
                    {currentValue}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex space-x-2">
                {[
                  { value: "24h", label: "24 Jam" },
                  { value: "7d", label: "7 Hari" },
                  { value: "30d", label: "30 Hari" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      timeRange === range.value
                        ? `bg-gradient-to-r ${sensorInfo.color} text-white shadow-lg`
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Download className="h-4 w-4" />
                <span className="text-sm font-semibold">Export Data</span>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div
                className={`${sensorInfo.bgColor} border ${sensorInfo.borderColor} rounded-2xl p-5`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-slate-400 font-medium">Maksimum</p>
                </div>
                <p className="text-3xl font-black text-white">{stats.max}</p>
                <p className="text-xs text-slate-400 mt-1">{sensorInfo.unit}</p>
              </div>

              <div
                className={`${sensorInfo.bgColor} border ${sensorInfo.borderColor} rounded-2xl p-5`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                  <p className="text-sm text-slate-400 font-medium">Minimum</p>
                </div>
                <p className="text-3xl font-black text-white">{stats.min}</p>
                <p className="text-xs text-slate-400 mt-1">{sensorInfo.unit}</p>
              </div>

              <div
                className={`${sensorInfo.bgColor} border ${sensorInfo.borderColor} rounded-2xl p-5`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <p className="text-sm text-slate-400 font-medium">
                    Rata-rata
                  </p>
                </div>
                <p className="text-3xl font-black text-white">{stats.avg}</p>
                <p className="text-xs text-slate-400 mt-1">{sensorInfo.unit}</p>
              </div>

              <div
                className={`${sensorInfo.bgColor} border ${sensorInfo.borderColor} rounded-2xl p-5`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <p className="text-sm text-slate-400 font-medium">
                    Total Data
                  </p>
                </div>
                <p className="text-3xl font-black text-white">
                  {chartData.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">data points</p>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Grafik Tren Data
                </h3>
                <span className="text-sm text-slate-400">
                  {timeRange === "24h" ? "Per Jam" : "Per Hari"}
                </span>
              </div>

              {/* Simple Line Chart */}
              <div className="relative h-80 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400 pr-2">
                  <span>{maxValue.toFixed(0)}</span>
                  <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
                  <span>{minValue.toFixed(0)}</span>
                </div>

                {/* Chart SVG */}
                <svg
                  className="w-full h-full pl-8"
                  viewBox="0 0 800 300"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  <defs>
                    <linearGradient
                      id={`gradient-${sensorType}`}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: sensorInfo.lineColor,
                          stopOpacity: 0.3,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: sensorInfo.lineColor,
                          stopOpacity: 0,
                        }}
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 75}
                      x2="800"
                      y2={i * 75}
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area under line */}
                  <path
                    d={`M 0 300 ${chartData
                      .map((point, i) => {
                        const x = (i / (chartData.length - 1)) * 800;
                        const y =
                          300 -
                          ((point.value - minValue) / (maxValue - minValue)) *
                            300;
                        return `L ${x} ${y}`;
                      })
                      .join(" ")} L 800 300 Z`}
                    fill={`url(#gradient-${sensorType})`}
                  />

                  {/* Line */}
                  <path
                    d={`M ${chartData
                      .map((point, i) => {
                        const x = (i / (chartData.length - 1)) * 800;
                        const y =
                          300 -
                          ((point.value - minValue) / (maxValue - minValue)) *
                            300;
                        return `${x},${y}`;
                      })
                      .join(" L ")}`}
                    fill="none"
                    stroke={sensorInfo.lineColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 800;
                    const y =
                      300 -
                      ((point.value - minValue) / (maxValue - minValue)) * 300;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={sensorInfo.lineColor}
                        className="hover:r-6 transition-all"
                      >
                        <title>{`${point.date}: ${point.value} ${sensorInfo.unit}`}</title>
                      </circle>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-slate-400 pl-8">
                  {chartData
                    .filter((_, i) => i % Math.ceil(chartData.length / 6) === 0)
                    .map((point, i) => (
                      <span key={i}>{point.date}</span>
                    ))}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="mt-6 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">
                Tabel Data Detail
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                        Tanggal
                      </th>
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                        Waktu
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                        Nilai ({sensorInfo.unit})
                      </th>
                      <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((point, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-300">
                            {point.date}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {point.time}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {point.value}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                point.value > stats.avg * 1.1
                                  ? "bg-red-500/20 text-red-400"
                                  : point.value < stats.avg * 0.9
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {point.value > stats.avg * 1.1
                                ? "Tinggi"
                                : point.value < stats.avg * 0.9
                                ? "Rendah"
                                : "Normal"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {chartData.length > 10 && (
                <p className="text-center text-slate-400 text-sm mt-4">
                  Menampilkan 10 data terbaru dari {chartData.length} total data
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SensorChartModal;
