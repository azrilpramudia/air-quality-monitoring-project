import { TrendingUp } from "lucide-react";

const EnhancedInfoCard = ({ icon, title, value, subtitle, color, onClick }) => (
  <div
    onClick={onClick}
    className="group relative glass-effect rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer"
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity blur-xl`}
    ></div>
    <div className="relative z-10">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
        <div className={`p-2 bg-gradient-to-br ${color} rounded-xl`}>
          {icon}
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
          {title}
        </p>
      </div>
      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
        {value}
      </p>
      <p className="text-xs text-slate-400 font-medium mb-2">{subtitle}</p>
      <div className="flex items-center space-x-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrendingUp className="h-3 w-3" />
        <span>Lihat Grafik</span>
      </div>
    </div>
  </div>
);

export default EnhancedInfoCard;
