/* eslint-disable no-unused-vars */
import { X, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { styles } from "../../styles/AQIModal.Styles";
import { aqiDetailInfo } from "../../utils/aqiDetailInfo";
import { motion, AnimatePresence } from "framer-motion";

const AQIModal = ({ isOpen, onClose, level, aqiInfo }) => {
  if (!level) return null;

  const detailInfo = aqiDetailInfo[level];
  if (!detailInfo) return null;

  return (
    <>
      <style>{styles}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="sticky top-3 right-3 sm:top-4 sm:right-4 float-right z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </button>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 md:p-8">
                {/* Header */}
                <div
                  className={`bg-gradient-to-r ${aqiInfo.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6`}
                >
                  <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-5 space-y-4 md:space-y-0">
                    {/* Emoji Section */}
                    <div className="flex-shrink-0 text-center md:text-left">
                      <span className="text-6xl sm:text-7xl md:text-8xl block">
                        {aqiInfo.emoji}
                      </span>
                    </div>

                    {/* Text Section */}
                    <div className="text-center md:text-left">
                      <div className="flex flex-wrap justify-center md:justify-start items-center space-x-2 sm:space-x-3 mb-2">
                        <span className="text-4xl sm:text-5xl font-black text-white">
                          {level}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          {aqiInfo.label}
                        </h2>
                      </div>
                      <p className="text-white/90 text-sm sm:text-base font-medium leading-relaxed max-w-md mx-auto md:mx-0">
                        {detailInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detail Condition */}
                <div
                  className={`${aqiInfo.bgColor} border ${aqiInfo.borderColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6`}
                >
                  <h3
                    className={`text-lg sm:text-xl font-bold ${aqiInfo.textColor} mb-3 flex items-center space-x-2`}
                  >
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Detail Kondisi</span>
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {detailInfo.details}
                  </p>
                </div>

                {/* Health Impact */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                    <span>Dampak Kesehatan</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detailInfo.effects.map((effect, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-start space-x-3 bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${aqiInfo.bgColor} mt-2 flex-shrink-0`}
                        ></div>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                          {effect}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Protective Steps */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                    <span>Langkah Perlindungan</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {detailInfo.actions.map((action, idx) => (
                      <motion.div
                        key={idx}
                        className={`${aqiInfo.bgColor} border ${aqiInfo.borderColor} rounded-xl sm:rounded-2xl p-4 sm:p-5`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className={`${aqiInfo.textColor} mb-3`}>
                          {typeof action.icon === "function" && action.icon()}
                        </div>
                        <h4 className="font-bold text-white text-sm sm:text-base mb-2">
                          {action.title}
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                          {action.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div
                  className={`${aqiInfo.bgColor} border-l-4 ${aqiInfo.borderColor} rounded-r-xl sm:rounded-r-2xl p-4 sm:p-6`}
                >
                  <h3
                    className={`text-base sm:text-lg font-bold ${aqiInfo.textColor} mb-3`}
                  >
                    💡 Rekomendasi Utama
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {detailInfo.recommendations}
                  </p>
                </div>

                {/* Footer Note */}
                <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4">
                  <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed text-center">
                    ⚠️ Informasi ini bersifat umum. Jika Anda memiliki kondisi
                    kesehatan khusus atau mengalami gejala yang mengkhawatirkan,
                    segera konsultasikan dengan tenaga medis profesional.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AQIModal;
