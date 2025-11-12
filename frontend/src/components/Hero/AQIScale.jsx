import { TrendingUp } from "lucide-react";

const AQIScale = ({ onClick }) => {
  const levels = [
    {
      level: 1,
      emoji: "😊",
      label: "Baik",
      desc: "Udara bersih dan sehat",
      color: "from-green-400 to-emerald-500",
    },
    {
      level: 2,
      emoji: "🙂",
      label: "Sedang",
      desc: "Masih dapat diterima",
      color: "from-yellow-400 to-amber-500",
    },
    {
      level: 3,
      emoji: "😐",
      label: "Tidak Sehat",
      desc: "Kurang baik untuk sensitif",
      color: "from-orange-400 to-orange-500",
    },
    {
      level: 4,
      emoji: "😷",
      label: "Sangat Tidak Sehat",
      desc: "Berisiko bagi semua",
      color: "from-red-500 to-rose-600",
    },
    {
      level: 5,
      emoji: "⚠️",
      label: "Berbahaya",
      desc: "Darurat kesehatan",
      color: "from-purple-500 to-fuchsia-600",
    },
  ];

  return (
    <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl animate-slide-in">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
          Skala Indeks Kualitas Udara
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm px-4">
          Panduan memahami tingkat kualitas udara berdasarkan konsentrasi
          polutan
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {levels.map((item, index) => (
          <div
            key={item.level}
            onClick={() => onClick(item.level)}
            className={`relative group bg-gradient-to-br ${
              item.color
            } rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer 
            ${index === levels.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl"></div>
            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl mb-2">{item.emoji}</div>
              <div className="text-xl sm:text-2xl font-black mb-1">
                {item.level}
              </div>
              <p className="text-sm sm:text-base font-bold mb-1">
                {item.label}
              </p>
              <p className="text-xs text-white/90 leading-relaxed">
                {item.desc}
              </p>
              <div className="flex items-center justify-center space-x-1 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400 group-hover:text-cyan-300">
                <TrendingUp className="h-3 w-3" />
                <span className="font-semibold tracking-wide">
                  Lihat Detail
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AQIScale;
