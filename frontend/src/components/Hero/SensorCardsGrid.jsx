import { ChevronRight } from "lucide-react";

const SensorCardsGrid = ({ sensorData, onOpenChart, handleSensorClick }) => {
  const sensors = [
    {
      type: "SHT31",
      title: "SHT31",
      desc: "Sensor Suhu & Kelembapan",
      color: "from-blue-500 to-blue-600",
      icon: "🌡️",
      data: [
        {
          label: "Suhu",
          value: `${sensorData.temperature ?? "--"}°C`,
          icon: "🌡️",
          chartType: "temperature",
          chartIcon: "🌡️",
          chartColor: "from-yellow-500 to-orange-500",
        },
        {
          label: "Kelembapan",
          value: `${sensorData.humidity ?? "--"}%`,
          icon: "💧",
          chartType: "humidity",
          chartIcon: "💧",
          chartColor: "from-blue-500 to-cyan-500",
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
          label: "Debu",
          value: `${sensorData.dust ?? "--"} µg/m³`,
          icon: "💨",
          chartType: "dust",
          chartIcon: "💨",
          chartColor: "from-slate-500 to-slate-600",
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
          label: "TVOC",
          value: `${sensorData.tvoc ?? "--"} ppb`,
          icon: "🌿",
          chartType: "tvoc",
          chartIcon: "🌿",
          chartColor: "from-cyan-500 to-teal-500",
        },
        {
          label: "eCO₂",
          value: `${sensorData.eco2 ?? "--"} ppm`,
          icon: "🌍",
          chartType: "eco2",
          chartIcon: "🌍",
          chartColor: "from-purple-500 to-pink-500",
        },
      ],
    },
  ];

  const handleDetailClick = (e, chartType, value, chartIcon, chartColor) => {
    e.stopPropagation(); // Prevent card click event
    onOpenChart(chartType, value, chartIcon, chartColor);
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-10 sm:mb-12 animate-slide-in"
      style={{ animationDelay: "0.25s" }}
    >
      {sensors.map((sensor, i) => (
        <div
          key={i}
          className="group relative glass-effect rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 border border-slate-700/50 hover:border-cyan-500/50 flex flex-col"
        >
          {/* Header Gradient Color */}
          <div
            className={`relative bg-gradient-to-r ${sensor.color} p-5 sm:p-6 text-white overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl sm:text-3xl">{sensor.icon}</span>
                  <h4 className="text-lg sm:text-xl font-bold">
                    {sensor.title}
                  </h4>
                </div>
                
              </div>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                {sensor.desc}
              </p>
            </div>
          </div>

          {/* Body Sensor - Clickable Items */}
          <div className="p-5 sm:p-6 space-y-3 bg-gradient-to-b from-slate-900/40 to-slate-800/40 flex-1">
            {sensor.data.map((d, idx) => (
              <div
                key={idx}
                onClick={(e) =>
                  handleDetailClick(
                    e,
                    d.chartType,
                    d.value,
                    d.chartIcon,
                    d.chartColor
                  )
                }
                className="flex items-center justify-between bg-slate-800/60 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer hover:bg-slate-800/80 hover:-translate-y-0.5 hover:shadow-lg group/item"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl">{d.icon}</span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">
                    {d.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {d.value}
                  </span>
                  <ChevronRight className="h-4 w-4 text-cyan-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer - Lihat Penjelasan Sensor (Navigate to Detail Page) */}
          <div
            onClick={() => handleSensorClick(sensor.type)}
            className="px-5 sm:px-6 pb-4 sm:pb-5 bg-gradient-to-b from-slate-800/40 to-slate-900/60 cursor-pointer"
          >
            <div className="flex items-center justify-center space-x-2 text-cyan-400 transition-all duration-300 group-hover:text-cyan-300">
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                Lihat Penjelasan Sensor
              </span>
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SensorCardsGrid;
