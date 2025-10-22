import React, { useState, useEffect } from "react";
import { MapPin, Cloud, Droplets, Wind, Sun, TrendingUp } from "lucide-react";

const Hero = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sensorData, setSensorData] = useState({
    aqi: 1,
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
    pm25: 0,
    pm10: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://192.168.1.10:5000/data");
        const data = await res.json();
        setSensorData(data);
      } catch (error) {
        console.error("Gagal memuat data sensor:", error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getAQIInfo = (aqi) => {
    if (aqi <= 1)
      return {
        color: "from-green-400 to-emerald-500",
        label: "Baik",
        desc: "Udara bersih dan sehat.",
        level: 1,
      };
    if (aqi <= 2)
      return {
        color: "from-yellow-400 to-amber-500",
        label: "Sedang",
        desc: "Masih dapat diterima.",
        level: 2,
      };
    if (aqi <= 3)
      return {
        color: "from-orange-400 to-orange-500",
        label: "Tidak Sehat",
        desc: "Kurang baik untuk kelompok sensitif.",
        level: 3,
      };
    if (aqi <= 4)
      return {
        color: "from-red-500 to-rose-600",
        label: "Sangat Tidak Sehat",
        desc: "Berisiko bagi semua kelompok.",
        level: 4,
      };
    return {
      color: "from-purple-500 to-fuchsia-600",
      label: "Berbahaya",
      desc: "Darurat kesehatan masyarakat.",
      level: 5,
    };
  };


  const aqiInfo = getAQIInfo(sensorData.aqi);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-slate-100 font-poppins">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Indeks Kualitas Udara (AQI)
          </h1>
          <p className="text-slate-400 text-sm">
            Pemantauan kualitas udara dan parameter lingkungan secara real-time
          </p>
        </div>

        {/* AQI Section */}
        <div className="flex flex-col items-center justify-center mt-10 mb-12">
          <div
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${aqiInfo.color} shadow-[0_0_25px_5px_rgba(0,0,0,0.5)] transition-all duration-700`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent rounded-full"></div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-inner"></div>
            <div className="absolute inset-[6px] rounded-full bg-gradient-to-b from-slate-900 to-slate-800"></div>
            <p className="relative text-6xl font-extrabold text-white drop-shadow-lg z-10">
              {sensorData.aqi ?? "--"}
            </p>
            <p className="relative text-lg font-semibold text-slate-200 mt-1 tracking-wide z-10">
              {aqiInfo.label}
            </p>
          </div>

          <p className="text-slate-400 text-center mt-4 text-sm max-w-sm">
            {aqiInfo.desc}
          </p>

          <div className="flex items-center space-x-2 mt-4">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Bandung, Jawa Barat</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}{" "}
              WIB
            </span>
          </div>
        </div>

        {/* Data Ringkasan Cuaca */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <InfoCard
            icon={<Sun className="h-6 w-6 text-yellow-400" />}
            title="Suhu"
            value={`${sensorData.temperature ?? "--"}°C`}
            subtitle="Cerah sebagian"
          />
          <InfoCard
            icon={<Droplets className="h-6 w-6 text-blue-400" />}
            title="Kelembaban"
            value={`${sensorData.humidity ?? "--"}%`}
            subtitle="Normal"
          />
          <InfoCard
            icon={<Wind className="h-6 w-6 text-cyan-400" />}
            title="TVOC"
            value={`${sensorData.tvoc ?? "--"} ppb`}
            subtitle="Kualitas udara"
          />
          <InfoCard
            icon={<Cloud className="h-6 w-6 text-purple-400" />}
            title="eCO₂"
            value={`${sensorData.eco2 ?? "--"} ppm`}
            subtitle="Karbon dioksida"
          />
          <InfoCard
            icon={<TrendingUp className="h-6 w-6 text-gray-300" />}
            title="Dust"
            value={`${sensorData.dust ?? "--"} µg/m³`}
            subtitle="Partikel debu"
          />
        </div>

        {/* Kartu Sensor */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-10">
          {[
            {
              title: "SHT31",
              desc: "Sensor Suhu & Kelembaban",
              color: "from-blue-500 to-blue-600",
              data: [
                { label: "Temperature", value: `${sensorData.temperature ?? "--"}°C` },
                { label: "Humidity", value: `${sensorData.humidity ?? "--"}%` },
              ],
            },
            {
              title: "GP2Y1010AU0F",
              desc: "Sensor Debu & Partikel",
              color: "from-purple-500 to-purple-600",
              data: [
                { label: "Dust", value: `${sensorData.dust ?? "--"} µg/m³` },
              ],
            },
            {
              title: "ENS160",
              desc: "Sensor Kualitas Udara",
              color: "from-green-500 to-teal-600",
              data: [
                { label: "VOC", value: `${sensorData.tvoc ?? "--"} ppb` },
                { label: "eCO₂", value: `${sensorData.eco2 ?? "--"} ppm` },
              ],
            },
          ].map((sensor, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700 hover:border-cyan-500 transition-all"
            >
              <div
                className={`bg-gradient-to-r ${sensor.color} p-4 text-white`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">{sensor.title}</h4>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                </div>
                <p className="text-xs opacity-90">{sensor.desc}</p>
              </div>
              <div className="p-5 space-y-3">
                {sensor.data.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-700/40 rounded-lg p-3"
                  >
                    <span className="text-sm text-slate-300">{d.label}</span>
                    <span className="text-lg font-semibold text-white">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      
{/* Skala AQI (Sederhana, Cerah & Nyaman Dilihat) */}
<div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 shadow-md backdrop-blur-sm">
  <h3 className="text-2xl font-bold text-white mb-6 text-center">
    Skala Indeks Kualitas Udara (AQI)
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
    {[
      {
        level: "1️⃣",
        label: "Baik",
        desc: "Udara bersih dan sehat",
        color: "bg-gradient-to-br from-green-300 to-emerald-400",
      },
      {
        level: "2️⃣",
        label: "Sedang",
        desc: "Masih dapat diterima",
        color: "bg-gradient-to-br from-yellow-300 to-amber-400",
      },
      {
        level: "3️⃣",
        label: "Tidak Sehat",
        desc: "Kurang baik untuk kelompok sensitif",
        color: "bg-gradient-to-br from-orange-300 to-orange-500",
      },
      {
        level: "4️⃣",
        label: "Sangat Tidak Sehat",
        desc: "Berisiko bagi semua kelompok",
        color: "bg-gradient-to-br from-red-400 to-rose-500",
      },
      {
        level: "5️⃣",
        label: "Berbahaya",
        desc: "Darurat kesehatan masyarakat",
        color: "bg-gradient-to-br from-purple-400 to-fuchsia-500",
      },
    ].map((item, i) => (
      <div
        key={i}
        className={`${item.color} rounded-xl p-4 text-center text-white shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300`}
      >
        <div className="text-2xl font-bold mb-1">{item.level}</div>
        <p className="text-base font-semibold">{item.label}</p>
        <p className="text-xs text-white/90 mt-1">{item.desc}</p>
      </div>
    ))}
  </div>

  <p className="text-center text-slate-400 text-xs mt-6">
    Skala AQI digunakan untuk mengukur tingkat kualitas udara berdasarkan konsentrasi polutan.
  </p>
</div>


        {/* Timestamp */}
        <div className="text-right text-xs text-slate-400 mt-4">
          Terakhir diperbarui:{" "}
          {currentTime.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-500 transition-all duration-300">
    <div className="flex items-center space-x-3 mb-2">
      {icon}
      <p className="text-sm font-semibold text-slate-300">{title}</p>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
  </div>
);

export default Hero;
