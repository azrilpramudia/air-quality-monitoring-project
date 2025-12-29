/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { X, TrendingUp, Calendar, Download } from "lucide-react";
import { styles } from "../../styles/SensorChartModal.Styles.js";
import { useRealtimeContext } from "../../context/RealtimeContext.jsx";
import ExcelJS from "exceljs";

const SensorChartModal = ({
  isOpen,
  onClose,
  sensorType,
  currentValue,
  icon,
  color,
}) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState("7d"); // 24h | 7d | 30d
  const { lastMessage } = useRealtimeContext();

  // ==========================================================
  // 1. Fetch data dari backend (HISTORICAL)
  // ==========================================================
  const fetchHistory = async () => {
    if (!sensorType) return;

    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;

    try {
      const res = await fetch(
        `http://localhost:5000/api/history/${sensorType}?hours=${hours}`
      );

      const json = await res.json();
      if (!Array.isArray(json?.data)) return;

      // ✅ BACKEND SUDAH FORMAT → LANGSUNG PAKAI
      setChartData(json.data);
    } catch (err) {
      console.warn("⚠️ Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    if (isOpen && sensorType) fetchHistory();
  }, [isOpen, sensorType, timeRange]);

  // ==========================================================
  // 2. Real-time MQTT → append data terbaru
  // ==========================================================

  useEffect(() => {
    if (!lastMessage || !isOpen) return;

    try {
      const payload = JSON.parse(lastMessage.message || "{}");

      let value;
      switch (sensorType) {
        case "temperature":
          value = payload.temp_c;
          break;
        case "humidity":
          value = payload.rh_pct;
          break;
        case "tvoc":
          value = payload.tvoc_ppb;
          break;
        case "eco2":
          value = payload.eco2_ppm;
          break;
        case "dust":
          value = payload.dust_ugm3;
          break;
        default:
          value = null;
      }

      if (typeof value !== "number" || isNaN(value)) return;

      const now = new Date();

      const newEntry = {
        date: now.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        time: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value,
      };

      setChartData((prev) => [...prev.slice(-499), newEntry]);
    } catch (err) {
      console.warn("⚠️ MQTT parse error:", err);
    }
  }, [lastMessage, isOpen]);

  // ==========================================================
  // Sensor Appearance Config
  // ==========================================================

  const getSensorInfo = () => {
    const configs = {
      temperature: {
        title: "Suhu",
        unit: "°C",
        color: "from-yellow-500 to-orange-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        lineColor: "#f59e0b",
      },
      humidity: {
        title: "Kelembapan",
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
        title: "Debu",
        unit: "µg/m³",
        color: "from-slate-500 to-slate-600",
        bgColor: "bg-slate-500/10",
        borderColor: "border-slate-500/30",
        lineColor: "#64748b",
      },
    };

    return configs[sensorType] || configs.temperature;
  };

  // ==========================================================
  // 4️⃣ SAFE STATISTICS (FIXED NaN / Infinity)
  // ==========================================================
  const getStatistics = () => {
    if (!chartData.length) return { min: 0, max: 0, avg: 0 };

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
    };
  };

  if (!isOpen) return null;

  const sensorInfo = getSensorInfo();
  const stats = getStatistics();

  const values = chartData.map((d) => d.value);
  const maxValue = values.length ? Math.max(...values) : 0;
  const minValue = values.length ? Math.min(...values) : 0;

  const safeY = (value) => {
    if (maxValue === minValue) return 150;
    return 300 - ((value - minValue) / (maxValue - minValue)) * 300;
  };

  // ==========================================================
  // Export Excel (tetap sama, tidak diubah)
  // ==========================================================
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sensor Data");

      worksheet.columns = [
        { header: "Tanggal", key: "date", width: 15 },
        { header: "Waktu", key: "time", width: 12 },
        { header: `Nilai (${getSensorInfo().unit})`, key: "value", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      const avg = chartData.reduce((a, b) => a + b.value, 0) / chartData.length;

      chartData.forEach((point) => {
        let status =
          point.value > avg * 1.1
            ? "Tinggi"
            : point.value < avg * 0.9
            ? "Rendah"
            : "Normal";

        worksheet.addRow({
          date: point.date,
          time: point.time,
          value: point.value,
          status,
        });
      });

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `history_${sensorType}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/50 shadow-2xl animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-3 right-3 float-right z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${sensorInfo.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="text-4xl sm:text-5xl">{icon}</div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      {sensorInfo.title}
                    </h2>
                    <p className="text-white/90 text-sm sm:text-lg">
                      Data Historis & Analisis
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-white/80 text-xs sm:text-sm mb-1">
                    Nilai Saat Ini
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-white">
                    {currentValue}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "24h", label: "24 Jam" },
                  { value: "7d", label: "7 Hari" },
                  { value: "30d", label: "30 Hari" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                      timeRange === range.value
                        ? `bg-gradient-to-r ${sensorInfo.color} text-white shadow-lg`
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold">
                  Export Data
                </span>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Maksimum",
                  value: stats.max,
                  icon: <TrendingUp className="h-5 w-5 text-green-400" />,
                  unit: sensorInfo.unit,
                },
                {
                  label: "Minimum",
                  value: stats.min,
                  icon: (
                    <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                  ),
                  unit: sensorInfo.unit,
                },
                {
                  label: "Rata-rata",
                  value: stats.avg,
                  icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
                  unit: sensorInfo.unit,
                },
                {
                  label: "Total Data",
                  value: chartData.length,
                  icon: <Calendar className="h-5 w-5 text-cyan-400" />,
                  unit: "data points",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`${sensorInfo.bgColor} border ${sensorInfo.borderColor} rounded-2xl p-4 sm:p-5`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {item.icon}
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{item.unit}</p>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Grafik Tren Data
                </h3>
                <span className="text-xs sm:text-sm text-slate-400">
                  {timeRange === "24h" ? "Per Jam" : "Per Hari"}
                </span>
              </div>

              <div className="relative h-64 sm:h-80 bg-slate-800/30 rounded-xl p-3 sm:p-4 border border-slate-700/50">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] sm:text-xs text-slate-400 pr-2">
                  <span>{maxValue.toFixed(0)}</span>
                  <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
                  <span>{minValue.toFixed(0)}</span>
                </div>

                {/* SVG Chart */}
                {chartData.length > 1 ? (
                  <svg
                    className="w-full h-full pl-6 sm:pl-8"
                    viewBox="0 0 800 300"
                    preserveAspectRatio="none"
                  >
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

                    {/* Filled Area */}
                    <path
                      d={`M 0 300 ${chartData
                        .map((point, i) => {
                          const x = (i / (chartData.length - 1)) * 800;
                          const y = safeY(point.value);
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
                          const y = safeY(point.value);
                          return `${x},${y}`;
                        })
                        .join(" L ")}`}
                      fill="none"
                      stroke={sensorInfo.lineColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Points */}
                    {chartData.map((point, i) => {
                      const x = (i / (chartData.length - 1)) * 800;
                      const y = safeY(point.value);
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill={sensorInfo.lineColor}
                          className="hover:r-5 transition-all"
                        >
                          <title>{`${point.date}: ${point.value} ${sensorInfo.unit}`}</title>
                        </circle>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs sm:text-sm">
                    No data available
                  </div>
                )}

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-slate-400 pl-6 sm:pl-8">
                  {chartData
                    .filter((_, i) => i % Math.ceil(chartData.length / 6) === 0)
                    .map((point, i) => (
                      <span key={i}>{point.date}</span>
                    ))}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="mt-6 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Tabel Data Detail
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-slate-400 font-semibold">
                        Tanggal
                      </th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-slate-400 font-semibold">
                        Waktu
                      </th>
                      <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-slate-400 font-semibold">
                        Nilai ({sensorInfo.unit})
                      </th>
                      <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-slate-400 font-semibold">
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
                          <td className="py-2 sm:py-3 px-3 sm:px-4 text-slate-300">
                            {point.date}
                          </td>
                          <td className="py-2 sm:py-3 px-3 sm:px-4 text-slate-300">
                            {point.time}
                          </td>
                          <td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-bold text-white">
                            {point.value}
                          </td>
                          <td className="py-2 sm:py-3 px-3 sm:px-4 text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
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
                <p className="text-center text-slate-400 text-xs sm:text-sm mt-4">
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
