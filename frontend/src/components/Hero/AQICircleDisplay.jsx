const AQICircleDisplay = ({ aqiInfo, sensorData, currentTime, onClick }) => {
  // Dynamic glow color mapping based on AQI level
  const glowColors = {
    1: "shadow-green-500/50",
    2: "shadow-yellow-400/50",
    3: "shadow-orange-500/50",
    4: "shadow-red-600/50",
    5: "shadow-purple-600/50",
  };

  const glow = glowColors[aqiInfo.level] || "shadow-cyan-500/40";

  return (
    <div className="flex flex-col items-center justify-center mb-12 sm:mb-16 animate-slide-in">
      {/* Main Circle AQI */}
      <div className="relative">
        {/* Background blur gradient */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${aqiInfo.color} opacity-20 blur-2xl animate-pulse`}
        ></div>

        {/* Circle Indicator */}
        <div
          onClick={() => onClick(aqiInfo.level)}
          className={`group relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${aqiInfo.color} shadow-2xl ${glow} transition-all duration-500 animate-float cursor-pointer hover:scale-105`}
        >
          {/* Decorative Layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-inner"></div>
          <div className="absolute inset-[10px] rounded-full bg-gradient-to-b from-slate-900 to-slate-800"></div>

          {/* Main Content */}
          <div className="relative z-10 text-center">
            <div className="text-4xl sm:text-5xl mb-2">{aqiInfo.emoji}</div>
            <p className="text-6xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-2xl tracking-tighter">
              {sensorData.aqi ?? "--"}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-2 tracking-wide">
              {aqiInfo.label}
            </p>

            {/* Hover Text: See Detailed Info */}
            <p className="text-xs text-cyan-400 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:text-cyan-300">
              Lihat Info Detail
            </p>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <div
        className="glass-effect rounded-2xl p-5 mt-8 max-w-md mx-auto shadow-xl animate-slide-in"
        style={{ animationDelay: "0.1s" }}
      >
        <p className="text-slate-300 text-center text-sm leading-relaxed">
          {aqiInfo.desc}
        </p>
      </div>

      {/* Location and Time */}
      <div
        className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 animate-slide-in px-4"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-full">
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
  );
};

export default AQICircleDisplay;
