import React, { useState, useEffect } from "react";
import {
  MapPin,
  Cloud,
  Droplets,
  Wind,
  Sun,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { connectMQTT } from "../lib/mqttConfig";

const Hero = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
  });

  // Update waktu tiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hubungkan ke MQTT Broker
  useEffect(() => {
    const client = connectMQTT(
      (data) => {
        console.log("MQTT Data:", data);
        setSensorData({
          aqi: data.aqi ?? 0,
          temperature: data.temp ?? 0,
          humidity: data.hum ?? 0,
          tvoc: data.tvoc ?? 0,
          eco2: data.eco2 ?? 0,
          dust: data.dust ?? 0,
        });
      },
      (connected) => setIsConnected(connected)
    );

    return () => client?.end(true, () => console.log("MQTT Disconnected"));
  }, []);

  // Warna & label AQI
  const getAQIInfo = (aqi) => {
    if (aqi <= 1)
      return {
        color: "from-green-400 to-emerald-500",
        label: "Baik",
        desc: "Udara bersih dan sehat.",
      };
    if (aqi <= 2)
      return {
        color: "from-yellow-400 to-amber-500",
        label: "Sedang",
        desc: "Masih dapat diterima.",
      };
    if (aqi <= 3)
      return {
        color: "from-orange-400 to-orange-500",
        label: "Tidak Sehat",
        desc: "Kurang baik untuk kelompok sensitif.",
      };
    if (aqi <= 4)
      return {
        color: "from-red-500 to-rose-600",
        label: "Sangat Tidak Sehat",
        desc: "Berisiko bagi semua kelompok.",
      };
    return {
      color: "from-purple-500 to-fuchsia-600",
      label: "Berbahaya",
      desc: "Darurat kesehatan masyarakat.",
    };
  };

  const aqiInfo = getAQIInfo(sensorData.aqi);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-slate-100 font-poppins">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            Indeks Kualitas Udara (AQI)
          </h1>
          <p className="text-slate-400 text-sm">
            Pemantauan kualitas udara dan parameter lingkungan secara real-time
          </p>
        </div>

        {/* Status koneksi */}
        <div className="flex justify-center mb-4">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
              isConnected
                ? "bg-green-500/10 text-green-400 border border-green-500/40"
                : "bg-red-500/10 text-red-400 border border-red-500/40"
            }`}
          >
            <Wifi
              className={`h-4 w-4 ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            />
            <span>
              {isConnected
                ? "Terhubung ke MQTT Broker"
                : "Terputus dari Broker"}
            </span>
          </div>
        </div>

        {/* AQI Section */}
        <div className="flex flex-col items-center justify-center mt-10 mb-12">
          <div
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${aqiInfo.color} shadow-[0_0_25px_5px_rgba(0,0,0,0.5)] transition-all duration-700`}
          >
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

        {/* Ringkasan Data Sensor */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <InfoCard
            icon={<Sun className="h-6 w-6 text-yellow-400" />}
            title="Suhu"
            value={`${sensorData.temperature ?? "--"}°C`}
          />
          <InfoCard
            icon={<Droplets className="h-6 w-6 text-blue-400" />}
            title="Kelembaban"
            value={`${sensorData.humidity ?? "--"}%`}
          />
          <InfoCard
            icon={<Wind className="h-6 w-6 text-cyan-400" />}
            title="TVOC"
            value={`${sensorData.tvoc ?? "--"} ppb`}
          />
          <InfoCard
            icon={<Cloud className="h-6 w-6 text-purple-400" />}
            title="eCO₂"
            value={`${sensorData.eco2 ?? "--"} ppm`}
          />
          <InfoCard
            icon={<TrendingUp className="h-6 w-6 text-gray-300" />}
            title="Debu"
            value={`${sensorData.dust ?? "--"} µg/m³`}
          />
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, value }) => (
  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-cyan-500 transition-all duration-300">
    <div className="flex items-center space-x-3 mb-2">
      {icon}
      <p className="text-sm font-semibold text-slate-300">{title}</p>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

export default Hero;
