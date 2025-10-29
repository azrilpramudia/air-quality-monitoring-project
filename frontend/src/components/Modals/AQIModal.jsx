import { X, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { styles } from "../../styles/AQIModal.Styles";
import { aqiDetailInfo } from "../../utils/aqiDetailInfo";

const AQIModal = ({ isOpen, onClose, level, aqiInfo }) => {
  if (!isOpen || !level) return null;

  const detailInfo = aqiDetailInfo[level];
  if (!detailInfo) return null;

  return (
    <>
      <style>{styles}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-4 right-4 float-right z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Modal Content */}
          <div className="p-6 md:p-8">
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${aqiInfo.color} rounded-2xl p-6 mb-6`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-6xl">{aqiInfo.emoji}</span>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-5xl font-black text-white">
                      {level}
                    </span>
                    <h2 className="text-3xl font-bold text-white">
                      {aqiInfo.label}
                    </h2>
                  </div>
                  <p className="text-white/90 text-base font-medium">
                    {detailInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail Kondisi */}
            <div
              className={`${aqiInfo.bgColor} border ${aqiInfo.borderColor} rounded-2xl p-6 mb-6`}
            >
              <h3
                className={`text-xl font-bold ${aqiInfo.textColor} mb-3 flex items-center space-x-2`}
              >
                <AlertCircle className="h-6 w-6" />
                <span>Detail Kondisi</span>
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {detailInfo.details}
              </p>
            </div>

            {/* Dampak Kesehatan */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-400" />
                <span>Dampak Kesehatan</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {detailInfo.effects.map((effect, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${aqiInfo.bgColor} mt-2 flex-shrink-0`}
                    ></div>
                    <p className="text-slate-300 text-sm">{effect}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Langkah Perlindungan */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Langkah Perlindungan</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {detailInfo.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className={`${aqiInfo.bgColor} border ${aqiInfo.borderColor} rounded-2xl p-5 hover:scale-105 transition-transform`}
                  >
                    <div className={`${aqiInfo.textColor} mb-3`}>
                      {typeof action.icon === "function" && action.icon()}
                    </div>
                    <h4 className="font-bold text-white mb-2">
                      {action.title}
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekomendasi */}
            <div
              className={`${aqiInfo.bgColor} border-l-4 ${aqiInfo.borderColor} rounded-r-2xl p-6`}
            >
              <h3 className={`text-lg font-bold ${aqiInfo.textColor} mb-3`}>
                💡 Rekomendasi Utama
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {detailInfo.recommendations}
              </p>
            </div>

            {/* Footer Note */}
            <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-slate-400 text-xs leading-relaxed text-center">
                ⚠️ Informasi ini bersifat umum. Jika Anda memiliki kondisi
                kesehatan khusus atau mengalami gejala yang mengkhawatirkan,
                segera konsultasikan dengan tenaga medis profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AQIModal;
