import { TrendingUp } from "lucide-react";

const AQIScale = ({ onClick }) => {
  const levels = [
    {
      level: 1,
      emoji: "😊",
      label: "Baik",
      desc: "Kualitas udara sangat baik dan tidak menimbulkan risiko kesehatan.",
      color: "from-green-400 to-emerald-500",
    },
    {
      level: 2,
      emoji: "🙂",
      label: "Sedang",
      desc: "Kualitas udara masih dapat diterima, namun individu sensitif dapat mengalami gejala ringan.",
      color: "from-yellow-400 to-amber-500",
    },
    {
      level: 3,
      emoji: "😐",
      label: "Tidak Sehat",
      desc: "Kelompok sensitif dapat mengalami dampak kesehatan, sementara masyarakat umum relatif tidak terpengaruh.",
      color: "from-orange-400 to-orange-500",
    },
    {
      level: 4,
      emoji: "😷",
      label: "Sangat Tidak Sehat",
      desc: "Setiap orang berpotensi mengalami efek kesehatan, terutama kelompok sensitif.",
      color: "from-red-500 to-rose-600",
    },
    {
      level: 5,
      emoji: "⚠️",
      label: "Berbahaya",
      desc: "Peringatan kesehatan: kondisi darurat di mana seluruh populasi berisiko.",
      color: "from-purple-500 to-fuchsia-600",
    },
  ];

  return (
    <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
          Skala Indeks Kualitas Udara
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
          Panduan tingkat kualitas udara berdasarkan konsentrasi polutan
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {levels.map((item, index) => (
          <button
            key={item.level}
            onClick={() => onClick(item.level)}
            className={`
              relative group
              bg-gradient-to-br ${item.color}
              rounded-xl sm:rounded-2xl
              p-4 sm:p-5
              text-white
              shadow-lg
              transition-all duration-300
              hover:shadow-2xl hover:-translate-y-1
              h-full
              ${index === levels.length - 1 ? "col-span-2 sm:col-span-1" : ""}
            `}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full text-center">
              {/* Emoji */}
              <div className="text-3xl mb-2 leading-none">
                {item.emoji}
              </div>

              {/* Level */}
              <div className="text-lg font-extrabold leading-none mb-1">
                {item.level}
              </div>

              {/* Label */}
              <p className="text-sm font-semibold mb-2">
                {item.label}
              </p>

              {/* Description */}
              <p className="text-[11px] leading-relaxed text-white/90 line-clamp-3">
                {item.desc}
              </p>

              {/* Action */}
              <div className="mt-auto pt-3 flex items-center justify-center gap-1 text-[11px] font-semibold text-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="h-3 w-3" />
                <span>Lihat Detail</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AQIScale;
