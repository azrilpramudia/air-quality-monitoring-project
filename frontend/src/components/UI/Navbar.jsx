import { useState, useEffect } from "react";
import { Wind, Droplets, Gauge, Activity } from "lucide-react";
import mqtt from "mqtt";

const Navbar = () => {
  const [activeTime, setActiveTime] = useState(
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [blinkRed, setBlinkRed] = useState(false);

  // Update waktu tiap detik
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Scroll progress
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

  // MQTT connection
  useEffect(() => {
    const MQTT_BROKER =
      import.meta.env.VITE_MQTT_URL || "wss://broker.emqx.io:8084/mqtt";
    const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC || "air/quality";

    const client = mqtt.connect(MQTT_BROKER, {
      clientId: "react_navbar_" + Math.random().toString(16).substring(2, 8),
      reconnectPeriod: 3000,
      clean: true,
    });

    let disconnectTimer;

    client.on("connect", () => {
      console.log("✅ Connected to MQTT Broker (Navbar):", MQTT_BROKER);
      setIsConnected(true);
      setBlinkRed(false);
      clearTimeout(disconnectTimer);
      client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) console.log("📡 Subscribed (Navbar):", MQTT_TOPIC);
      });
    });

    const handleDisconnect = () => {
      setIsConnected(false);
      disconnectTimer = setTimeout(() => setBlinkRed(true), 5000);
    };

    client.on("close", handleDisconnect);
    client.on("error", handleDisconnect);

    return () => {
      clearTimeout(disconnectTimer);
      client.end();
    };
  }, []);

  // Navigasi antar halaman
  const goTop = () => {
    if (window.location.hash !== "#top") window.location.hash = "#top";
    document
      .getElementById("hero-top")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openSensorDetail = (key) => {
    window.location.hash = `#${key}`;
    document
      .getElementById("hero-root")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md font-poppins ${
        scrolled
          ? "bg-[rgba(4,10,24,0.92)] ring-1 ring-cyan-300/10 shadow-lg"
          : "bg-[rgba(4,10,24,0.72)] ring-1 ring-cyan-300/10 shadow"
      }`}
      aria-label="Global Navigation"
    >
      {/* progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 transition-all"
        style={{ width: `${progress}%` }}
      />

      <div
        className={`max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-3 px-3 sm:px-4 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        {/* Brand */}
        <button
          onClick={goTop}
          className="group flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <div className="grid place-items-center rounded-xl border h-9 w-9 sm:h-10 sm:w-10 bg-[#0E1A2B]/80 border-cyan-300/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Wind className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="text-left">
            <h1 className="font-semibold tracking-tight leading-none bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent text-[15px] sm:text-[17px] md:text-lg">
              Air Quality Monitor
            </h1>
            <p className="text-[11px] sm:text-[12px] leading-tight text-cyan-100/70">
              Real-time Environmental Data
            </p>
          </div>
        </button>

        {/* Desktop sensor pills */}
        <div className="hidden lg:flex items-center gap-2">
          <SensorPill
            onClick={() => openSensorDetail("sht31")}
            icon={<Droplets className="h-4 w-4" />}
            label="SHT31"
          />
          <Dot />
          <SensorPill
            onClick={() => openSensorDetail("gp2y")}
            icon={<Gauge className="h-4 w-4" />}
            label="GP2Y"
          />
          <Dot />
          <SensorPill
            onClick={() => openSensorDetail("ens160")}
            icon={<Activity className="h-4 w-4" />}
            label="ENS160"
          />
        </div>

        {/* Status */}
        <div className="flex items-center flex-wrap justify-end gap-2 sm:gap-3 rounded-xl border border-cyan-300/10 bg-[#0B1628]/70 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm text-[11px] sm:text-[12px] font-medium">
          {/* MQTT status */}
          <div className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? "bg-green-400 animate-pulse"
                  : blinkRed
                  ? "bg-red-500 animate-ping"
                  : "bg-red-500"
              }`}
            ></div>
            <span
              className={`font-semibold ${
                isConnected ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <span className="hidden sm:block w-px h-4 bg-cyan-300/15" />

          {/* LIVE indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="hidden sm:inline text-emerald-300 font-semibold tracking-wider">
            LIVE
          </span>

          <span className="hidden sm:block w-px h-4 bg-cyan-300/15" />
          <time className="font-mono text-[11px] sm:text-[12px] bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent font-semibold">
            {activeTime}
          </time>
        </div>
      </div>

      {/* Mobile pills */}
      <div className="lg:hidden border-t border-cyan-300/10 bg-[#0B1628]/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
          <SensorPill
            onClick={() => openSensorDetail("sht31")}
            icon={<Droplets className="h-4 w-4" />}
            label="SHT31"
          />
          <SensorPill
            onClick={() => openSensorDetail("gp2y")}
            icon={<Gauge className="h-4 w-4" />}
            label="GP2Y"
          />
          <SensorPill
            onClick={() => openSensorDetail("ens160")}
            icon={<Activity className="h-4 w-4" />}
            label="ENS160"
          />
        </div>
      </div>
    </nav>
  );
};

const Dot = () => <span className="mx-1 h-1 w-1 rounded-full bg-cyan-300/30" />;

const SensorPill = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    title={`Buka detail ${label}`}
    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 bg-[#0B1628]/70 border-cyan-300/20 text-cyan-100 hover:bg-[#0B1E3A]/80 hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
  >
    <span className="text-cyan-300">{icon}</span>
    <span>{label}</span>
  </button>
);

export default Navbar;
