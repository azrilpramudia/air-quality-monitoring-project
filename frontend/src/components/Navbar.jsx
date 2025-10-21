import React, { useState, useEffect } from "react";
import { Wind, Droplets, Gauge, Activity } from "lucide-react";

const Navbar = () => {
  const [activeTime, setActiveTime] = useState(
    new Date().toLocaleTimeString("id-ID")
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTime(new Date().toLocaleTimeString("id-ID"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-[#22292E] to-[#2A4E5D] shadow-lg font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title Section */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/15 backdrop-blur-sm p-2 rounded-lg border border-white/20">
              <Wind className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Air Quality Monitor
              </h1>
              <p className="text-slate-200 text-xs">
                Real-time Environmental Data
              </p>
            </div>
          </div>

          {/* Sensor Indicators */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
              <Droplets className="h-4 w-4 text-slate-200" />
              <div>
                <p className="text-xs text-slate-300 leading-tight">
                  Temperature
                </p>
                <p className="text-xs font-semibold text-white">SHT31</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
              <Droplets className="h-4 w-4 text-slate-200" />
              <div>
                <p className="text-xs text-slate-300 leading-tight">Humidity</p>
                <p className="text-xs font-semibold text-white">SHT31</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
              <Gauge className="h-4 w-4 text-slate-200" />
              <div>
                <p className="text-xs text-slate-300 leading-tight">Dust</p>
                <p className="text-xs font-semibold text-white">GP2Y</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
              <Activity className="h-4 w-4 text-slate-200" />
              <div>
                <p className="text-xs text-slate-300 leading-tight">
                  Air Quality
                </p>
                <p className="text-xs font-semibold text-white">ENS160</p>
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div className="hidden lg:flex flex-col items-end">
            <div className="flex items-center space-x-2 mb-0.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-200 text-xs font-medium">Live</span>
            </div>
            <p className="text-white font-mono text-base font-semibold">
              {activeTime}
            </p>
          </div>
        </div>

        {/* Mobile Sensor Indicators */}
        <div className="md:hidden pb-4 grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
            <Droplets className="h-4 w-4 text-blue-200" />
            <span className="text-xs font-semibold text-white">SHT31</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
            <Droplets className="h-4 w-4 text-cyan-200" />
            <span className="text-xs font-semibold text-white">SHT1</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
            <Gauge className="h-4 w-4 text-purple-200" />
            <span className="text-xs font-semibold text-white">GP2Y</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
            <Activity className="h-4 w-4 text-green-200" />
            <span className="text-xs font-semibold text-white">ENS160</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
