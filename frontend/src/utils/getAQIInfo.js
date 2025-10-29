export const getAQIInfo = (aqi) => {
    if (aqi <= 1)
      return {
        color: "from-green-400 to-emerald-500",
        bgGlow: "shadow-green-500/30",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-400",
        label: "Baik",
        desc: "Udara bersih dan sehat untuk aktivitas luar ruangan.",
        level: 1,
        emoji: "😊",
      };
    if (aqi <= 2)
      return {
        color: "from-yellow-400 to-amber-500",
        bgGlow: "shadow-yellow-500/30",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-400",
        label: "Sedang",
        desc: "Kualitas udara masih dapat diterima dengan baik.",
        level: 2,
        emoji: "🙂",
      };
    if (aqi <= 3)
      return {
        color: "from-orange-400 to-orange-500",
        bgGlow: "shadow-orange-500/30",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-400",
        label: "Tidak Sehat",
        desc: "Kurang baik untuk kelompok sensitif seperti anak-anak.",
        level: 3,
        emoji: "😐",
      };
    if (aqi <= 4)
      return {
        color: "from-red-500 to-rose-600",
        bgGlow: "shadow-red-500/30",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-400",
        label: "Sangat Tidak Sehat",
        desc: "Berisiko bagi semua kelompok, batasi aktivitas luar.",
        level: 4,
        emoji: "😷",
      };
    return {
      color: "from-purple-500 to-fuchsia-600",
      bgGlow: "shadow-purple-500/30",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      label: "Berbahaya",
      desc: "Darurat kesehatan! Hindari aktivitas luar ruangan.",
      level: 5,
      emoji: "⚠️",
    };
  };