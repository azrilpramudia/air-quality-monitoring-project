/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Wind, Droplets, Gauge, Activity } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setScrolled(y > 8);
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const p = total > 0 ? (y / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    if (window.location.hash !== "#top") window.location.hash = "#top";
    document
      .getElementById("hero-top")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const openSensorDetail = (key) => {
    window.location.hash = `#${key}`;
    document
      .getElementById("hero-root")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-md shadow-lg shadow-emerald-500/10 border-b border-emerald-500/20"
          : "bg-transparent"
      }`}
    >
      {/* Progress bar */}
      <div
        className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-200"
        style={{ width: `${progress}%` }}
      />

      {/* Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={goTop}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="relative">
              <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="hidden md:block text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Air Quality Monitor
              </h1>
              <p className="text-xs text-slate-400">
                Real-time Environmental Data
              </p>
            </div>
          </button>

          {/* Sensor shortcuts */}
          <div className="hidden lg:flex items-center space-x-2">
            <SensorPill
              icon={<Droplets className="w-4 h-4" />}
              label="SHT31"
              onClick={() => openSensorDetail("sht31")}
            />
            <SensorPill
              icon={<Wind className="w-4 h-4" />}
              label="GP2Y"
              onClick={() => openSensorDetail("gp2y")}
            />
            <SensorPill
              icon={<Gauge className="w-4 h-4" />}
              label="ENS160"
              onClick={() => openSensorDetail("ens160")}
            />
          </div>

          {/* Minimal Status */}
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
            <span className="text-sm text-emerald-400 font-medium">
              Realtime Monitoring
            </span>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center space-x-1">
            <SensorPill
              icon={<Droplets className="w-4 h-4" />}
              label="SHT31"
              onClick={() => openSensorDetail("sht31")}
            />
            <SensorPill
              icon={<Wind className="w-4 h-4" />}
              label="GP2Y"
              onClick={() => openSensorDetail("gp2y")}
            />
            <SensorPill
              icon={<Gauge className="w-4 h-4" />}
              label="ENS160"
              onClick={() => openSensorDetail("ens160")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SensorPill = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
  >
    <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">
      {icon}
    </span>
    <span className="text-sm text-slate-300 group-hover:text-emerald-400 transition-colors font-medium">
      {label}
    </span>
  </button>
);

export default Navbar;