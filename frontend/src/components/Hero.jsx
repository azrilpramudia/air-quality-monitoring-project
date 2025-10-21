import React, { useState, useEffect } from "react";
import {
  MapPin,
  Droplets,
  Wind,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

const Hero = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulasi data - nanti bisa diganti dengan data real dari sensor
  const aqiValue = 78;
  const aqiStatus = "Sedang";
  const aqiColor = "bg-yellow-400";
  const location = "Bandung, Jawa Barat";

  return (
    <section className="font-poppins bg-gradient-to-b from-slate-50 to-white">
      {/* Main AQI Display */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Location & Time Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-slate-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{location}</h1>
              <p className="text-sm text-slate-500">
                Pemantauan Kualitas Udara Real-Time
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm">
              Terakhir Diperbarui: {currentTime.toLocaleTimeString("id-ID")} WIB
            </span>
          </div>
        </div>

        {/* Main AQI Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: AQI Value */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-8 md:p-12 flex flex-col justify-center items-center border-r border-slate-200">
              <div
                className={`w-40 h-40 ${aqiColor} rounded-full flex items-center justify-center shadow-lg mb-4`}
              >
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">
                    {aqiValue}
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    AQI
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {aqiStatus}
              </h2>
              <p className="text-sm text-slate-600 text-center max-w-xs">
                Kualitas udara dapat diterima untuk sebagian besar individu
              </p>
            </div>

            {/* Right: Environmental Data */}
            <div className="p-8 md:p-12 bg-white">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                Data Lingkungan Saat Ini
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Suhu</p>
                      <p className="text-lg font-bold text-slate-800">28.5°C</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Normal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-cyan-100 p-2 rounded-lg">
                      <Droplets className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Kelembaban</p>
                      <p className="text-lg font-bold text-slate-800">73%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Tinggi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Wind className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Kecepatan Angin</p>
                      <p className="text-lg font-bold text-slate-800">8 km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-600">
                    <span className="text-xs font-medium">Tenang</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Eye className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PM2.5</p>
                      <p className="text-lg font-bold text-slate-800">
                        32 µg/m³
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <span className="text-xs font-medium">Sedang</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">SHT31</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Sensor Suhu & Kelembaban
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Suhu</span>
                <span className="text-sm font-semibold text-slate-800">
                  28.5°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Kelembaban</span>
                <span className="text-sm font-semibold text-slate-800">
                  72%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">AHT21</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-slate-600 mb-3">Sensor Kelembaban</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Suhu</span>
                <span className="text-sm font-semibold text-slate-800">
                  28.3°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Kelembaban</span>
                <span className="text-sm font-semibold text-slate-800">
                  73%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">GP2Y1010AU0F</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Sensor Debu & Partikel
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">PM2.5</span>
                <span className="text-sm font-semibold text-slate-800">
                  32 µg/m³
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">PM10</span>
                <span className="text-sm font-semibold text-slate-800">
                  45 µg/m³
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">ENS160</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-slate-600 mb-3">Sensor Kualitas Udara</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">VOC</span>
                <span className="text-sm font-semibold text-slate-800">
                  125 ppb
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">eCO2</span>
                <span className="text-sm font-semibold text-slate-800">
                  420 ppm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AQI Scale Reference */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Skala Indeks Kualitas Udara
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-400">
              <div className="text-2xl font-bold text-green-700">0-50</div>
              <div className="text-xs font-semibold text-green-700 mt-1">
                Baik
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-400">
              <div className="text-2xl font-bold text-yellow-700">51-100</div>
              <div className="text-xs font-semibold text-yellow-700 mt-1">
                Sedang
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-400">
              <div className="text-2xl font-bold text-orange-700">101-150</div>
              <div className="text-xs font-semibold text-orange-700 mt-1">
                Tidak Sehat
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border-2 border-red-400">
              <div className="text-2xl font-bold text-red-700">151-200</div>
              <div className="text-xs font-semibold text-red-700 mt-1">
                Sangat Tidak Sehat
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border-2 border-purple-400">
              <div className="text-2xl font-bold text-purple-700">201-300</div>
              <div className="text-xs font-semibold text-purple-700 mt-1">
                Berbahaya
              </div>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-lg border-2 border-rose-600">
              <div className="text-2xl font-bold text-rose-700">300+</div>
              <div className="text-xs font-semibold text-rose-700 mt-1">
                Sangat Berbahaya
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
