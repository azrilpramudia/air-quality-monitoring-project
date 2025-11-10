import { Sun, Droplets, Wind, Cloud, TrendingUp } from "lucide-react";
import EnhancedInfoCard from "./EnhancedInfoCard.jsx";

const InfoCardsGrid = ({ sensorData, onOpenChart }) => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 sm:mb-12 animate-slide-in"
    style={{ animationDelay: "0.2s" }}
  >
    <EnhancedInfoCard
      icon={<Sun className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />}
      title="Suhu"
      value={`${sensorData.temperature ?? "--"}°C`}
      subtitle="Cerah sebagian"
      color="from-yellow-500/20 to-orange-500/20"
      onClick={() =>
        onOpenChart(
          "temperature",
          `${sensorData.temperature ?? "--"}°C`,
          "🌡️",
          "from-yellow-500 to-orange-500"
        )
      }
    />
    <EnhancedInfoCard
      icon={<Droplets className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />}
      title="Kelembapan"
      value={`${sensorData.humidity ?? "--"}%`}
      subtitle="Normal"
      color="from-blue-500/20 to-cyan-500/20"
      onClick={() =>
        onOpenChart(
          "humidity",
          `${sensorData.humidity ?? "--"}%`,
          "💧",
          "from-blue-500 to-cyan-500"
        )
      }
    />
    <EnhancedInfoCard
      icon={<Wind className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-400" />}
      title="TVOC"
      value={`${sensorData.tvoc ?? "--"} ppb`}
      subtitle="Kualitas udara"
      color="from-cyan-500/20 to-teal-500/20"
      onClick={() =>
        onOpenChart(
          "tvoc",
          `${sensorData.tvoc ?? "--"} ppb`,
          "🌿",
          "from-cyan-500 to-teal-500"
        )
      }
    />
    <EnhancedInfoCard
      icon={<Cloud className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />}
      title="eCO₂"
      value={`${sensorData.eco2 ?? "--"} ppm`}
      subtitle="Karbon dioksida"
      color="from-purple-500/20 to-pink-500/20"
      onClick={() =>
        onOpenChart(
          "eco2",
          `${sensorData.eco2 ?? "--"} ppm`,
          "🌍",
          "from-purple-500 to-pink-500"
        )
      }
    />
    <EnhancedInfoCard
      icon={<TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />}
      title="Debu"
      value={`${sensorData.dust ?? "--"} µg/m³`}
      subtitle="Partikel debu"
      color="from-slate-500/20 to-slate-600/20"
      onClick={() =>
        onOpenChart(
          "dust",
          `${sensorData.dust ?? "--"} µg/m³`,
          "💨",
          "from-slate-500 to-slate-600"
        )
      }
    />
  </div>
);

export default InfoCardsGrid;
