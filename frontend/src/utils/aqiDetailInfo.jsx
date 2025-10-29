import {
  X,
  AlertCircle,
  CheckCircle,
  Heart,
  Home,
  Baby,
  Leaf,
  Wind,
} from "lucide-react";

export const aqiDetailInfo = {
    1: {
      description:
        "Kualitas udara sangat baik dan tidak menimbulkan risiko kesehatan.",
      details:
        "Udara bersih dengan konsentrasi polutan yang sangat rendah. Kondisi ideal untuk semua aktivitas outdoor.",
      effects: [
        "Tidak ada dampak kesehatan yang signifikan",
        "Aman untuk semua kelompok, termasuk anak-anak dan lansia",
        "Visibilitas udara sangat baik dan jernih",
        "Kondisi optimal untuk olahraga outdoor",
      ],
      actions: [
        {
          icon: () => <Leaf className="h-5 w-5" />,
          title: "Aktivitas Outdoor",
          desc: "Waktu yang sempurna untuk aktivitas luar ruangan, olahraga, dan rekreasi.",
        },
        {
          icon: () => <Home className="h-5 w-5" />,
          title: "Ventilasi Rumah",
          desc: "Buka jendela untuk sirkulasi udara segar ke dalam rumah.",
        },
        {
          icon: () => <Heart className="h-5 w-5" />,
          title: "Kesehatan",
          desc: "Nikmati udara segar tanpa khawatir dampak kesehatan.",
        },
      ],
      recommendations:
        "Manfaatkan kualitas udara yang baik untuk beraktivitas di luar ruangan. Ini adalah waktu terbaik untuk berolahraga, berjalan-jalan, atau aktivitas outdoor lainnya.",
    },
    2: {
      description:
        "Kualitas udara dapat diterima untuk sebagian besar orang, namun beberapa individu sensitif mungkin mengalami gejala ringan.",
      details:
        "Tingkat polusi udara masih dalam batas aman, tetapi mulai terdeteksi peningkatan konsentrasi polutan tertentu.",
      effects: [
        "Umumnya aman untuk aktivitas normal",
        "Kelompok sensitif mungkin merasakan sedikit ketidaknyamanan",
        "Penderita asma atau alergi perlu sedikit waspada",
        "Masih aman untuk aktivitas outdoor ringan hingga sedang",
      ],
      actions: [
        {
          icon: () => <AlertCircle className="h-5 w-5" />,
          title: "Kelompok Sensitif",
          desc: "Penderita asma atau penyakit pernapasan sebaiknya membatasi aktivitas outdoor yang berkepanjangan.",
        },
        {
          icon: () => <Wind className="h-5 w-5" />,
          title: "Pantau Kondisi",
          desc: "Perhatikan gejala seperti batuk atau sesak napas, terutama saat beraktivitas.",
        },
        {
          icon: () => <Baby className="h-5 w-5" />,
          title: "Anak & Lansia",
          desc: "Batasi waktu bermain outdoor untuk anak-anak dan orang tua.",
        },
      ],
      recommendations:
        "Aktivitas outdoor masih aman untuk sebagian besar orang. Namun, jika Anda memiliki kondisi pernapasan sensitif, pertimbangkan untuk mengurangi aktivitas outdoor yang intens.",
    },
    3: {
      description:
        "Anggota kelompok sensitif dapat mengalami efek kesehatan. Masyarakat umum kemungkinan tidak akan terpengaruh.",
      details:
        "Konsentrasi polutan mulai meningkat dan dapat mempengaruhi kesehatan kelompok rentan seperti anak-anak, lansia, dan penderita penyakit pernapasan.",
      effects: [
        "Kelompok sensitif dapat mengalami iritasi pernapasan",
        "Peningkatan gejala pada penderita asma dan alergi",
        "Mungkin terjadi batuk, sesak napas ringan",
        "Penurunan stamina saat beraktivitas outdoor",
        "Mata dan tenggorokan terasa kering atau gatal",
      ],
      actions: [
        {
          icon: () => <AlertCircle className="h-5 w-5" />,
          title: "Batasi Aktivitas",
          desc: "Kelompok sensitif sebaiknya mengurangi atau menghindari aktivitas outdoor yang berkepanjangan dan intens.",
        },
        {
          icon: () => <Home className="h-5 w-5" />,
          title: "Tetap di Dalam",
          desc: "Lebih baik beraktivitas di dalam ruangan dengan ventilasi yang baik atau AC dengan filter udara.",
        },
        {
          icon: () => <Heart className="h-5 w-5" />,
          title: "Gunakan Masker",
          desc: "Pertimbangkan menggunakan masker N95 saat harus keluar rumah.",
        },
      ],
      recommendations:
        "Kelompok sensitif sebaiknya membatasi waktu di luar ruangan. Tutup jendela untuk mencegah polusi masuk. Gunakan air purifier di dalam rumah jika tersedia.",
    },
    4: {
      description:
        "Setiap orang dapat mulai mengalami efek kesehatan. Anggota kelompok sensitif dapat mengalami efek kesehatan yang lebih serius.",
      details:
        "Tingkat polusi udara berbahaya dan dapat mempengaruhi kesehatan semua orang, tidak hanya kelompok sensitif. Paparan berkepanjangan dapat menyebabkan masalah kesehatan serius.",
      effects: [
        "Semua orang dapat mengalami iritasi pernapasan",
        "Peningkatan signifikan gejala pada penderita asma",
        "Batuk, sesak napas, dan ketidaknyamanan pernapasan",
        "Penurunan fungsi paru-paru sementara",
        "Sakit kepala dan kelelahan",
        "Iritasi mata, hidung, dan tenggorokan",
        "Peningkatan risiko infeksi pernapasan",
      ],
      actions: [
        {
          icon: () => <AlertCircle className="h-5 w-5" />,
          title: "Hindari Outdoor",
          desc: "Semua orang sebaiknya menghindari aktivitas outdoor yang berkepanjangan, terutama aktivitas intens.",
        },
        {
          icon: () => <Home className="h-5 w-5" />,
          title: "Tetap di Dalam",
          desc: "Tutup semua jendela dan pintu. Gunakan AC atau air purifier dengan filter HEPA.",
        },
        {
          icon: () => <Heart className="h-5 w-5" />,
          title: "Waspada Gejala",
          desc: "Segera hubungi dokter jika mengalami sesak napas, nyeri dada, atau gejala serius lainnya.",
        },
      ],
      recommendations:
        "Batasi semua aktivitas outdoor. Kelompok sensitif harus tetap di dalam ruangan dengan jendela tertutup. Gunakan masker N95 jika terpaksa keluar. Hindari olahraga outdoor sepenuhnya.",
    },
    5: {
      description:
        "Peringatan kesehatan: semua orang dapat mengalami efek kesehatan yang serius. Ini adalah kondisi darurat kesehatan masyarakat.",
      details:
        "Tingkat polusi sangat berbahaya. Seluruh populasi lebih mungkin terpengaruh secara serius. Kondisi ini memerlukan tindakan darurat dan perlindungan maksimal.",
      effects: [
        "Efek kesehatan serius pada seluruh populasi",
        "Serangan asma parah dan eksaserbasi penyakit pernapasan",
        "Kesulitan bernapas signifikan bahkan saat istirahat",
        "Peningkatan drastis risiko penyakit kardiovaskular",
        "Sakit kepala parah, mual, dan pusing",
        "Risiko tinggi untuk komplikasi medis serius",
        "Dapat memicu kondisi darurat medis",
        "Dampak jangka panjang pada fungsi paru-paru",
      ],
      actions: [
        {
          icon: () => <AlertCircle className="h-5 w-5" />,
          title: "DARURAT - Tetap di Dalam",
          desc: "WAJIB tetap di dalam ruangan. Hindari semua aktivitas outdoor. Ini adalah kondisi darurat kesehatan.",
        },
        {
          icon: () => <Home className="h-5 w-5" />,
          title: "Segel Ruangan",
          desc: "Tutup rapat semua jendela dan pintu. Gunakan handuk basah untuk menutup celah. Aktifkan air purifier maksimal.",
        },
        {
          icon: () => <Heart className="h-5 w-5" />,
          title: "Siaga Medis",
          desc: "Siapkan obat-obatan darurat. Hubungi dokter jika mengalami gejala apapun. Pertimbangkan evakuasi jika memungkinkan.",
        },
      ],
      recommendations:
        "DARURAT KESEHATAN! Jangan keluar rumah kecuali sangat mendesak. Gunakan masker N95 atau P100 jika terpaksa keluar. Pantau berita dan informasi dari otoritas kesehatan. Pertimbangkan untuk meninggalkan area jika memungkinkan.",
    },
  };