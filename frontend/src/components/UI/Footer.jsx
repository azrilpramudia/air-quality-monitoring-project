/* eslint-disable no-unused-vars */
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Github,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative isolate bg-slate-950 text-slate-300 border-t border-slate-800 mt-auto">
      {/* Smooth top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent pointer-events-none" />

      {/* Soft background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-950 to-black pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 pb-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Air Quality Monitor
              </h3>
            </div>

            <p className="text-sm leading-relaxed text-slate-400">
              Sistem pemantauan kualitas udara real-time dengan teknologi sensor
              presisi dan visualisasi data yang intuitif.
            </p>
          </div>

          {/* Main Feature */}
          <div>
            <h4 className="text-white/90 font-semibold text-xs uppercase tracking-[0.12em] mb-4">
              Fitur Utama
            </h4>
            <ul className="space-y-3">
              {[
                { Icon: Clock, text: "Monitoring Real-time" },
                { Icon: TrendingUp, text: "Grafik Historis" },
                { Icon: Shield, text: "Data Akurat" },
                { Icon: Zap, text: "Update 1 Detik" },
              ].map(({ Icon, text }, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Icon className="h-4 w-4 text-cyan-400/70" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/90 font-semibold text-xs uppercase tracking-[0.12em] mb-4">
              Kontak
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="h-4 w-4 mt-0.5 text-cyan-400/70 flex-shrink-0" />
                <span>Bandung, Jawa Barat</span>
              </li>
              {[
                {
                  text: "miraaldina34@gmail.com",
                  href: "mailto:miraaldina34@gmail.com",
                },
                {
                  text: "apriyana.prawira26@gmail.com",
                  href: "mailto:apriyana.prawira26@gmail.com",
                },
                {
                  text: "azrilpramudia01@gmail.com",
                  href: "mailto:azrilpramudia01@gmail.com",
                },
              ].map(({ text, href }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-cyan-400/70 flex-shrink-0" />
                  <a
                    href={href}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <h4 className="text-white/90 font-semibold text-xs uppercase tracking-[0.12em] mb-4">
              Tim Pengembang
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Mira Aldina", phone: "085764183130" },
                { name: "Apriyana Prawira", phone: "085797586745" },
                { name: "Azril Pramudia", phone: "081394323746" },
              ].map(({ name, phone }, i) => (
                <li key={i}>
                  <div className="text-slate-200 font-medium">{name}</div>
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Slimmer divider */}
        <div className="mx-auto my-6 h-px w-[85%] max-w-5xl bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* GitHub moved to the left, right before © */}
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <a
              href="https://github.com/azrilpramudia/air-quality-monitoring-project"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-cyan-500/40 transition-all group"
              aria-label="Buka repositori GitHub AirSense"
            >
              <Github className="h-4 w-4 text-slate-400 group-hover:text-cyan-400" />
            </a>

            <span>© {currentYear} AirSense.</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Dibuat dengan{" "}
              <Heart className="h-3.5 w-3.5 text-red-500 animate-pulse" /> di
              Bandung
            </span>
          </div>

          {/* (Privacy/Terms/FAQ link removed) */}
        </div>

        {/* Status Badge */}
        <div className="mt-6 mb-0 pb-0 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs text-slate-400">
              Sistem Berjalan Normal
            </span>
          </div>
        </div>
      </div>

      {/* Underline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-800/70 to-transparent pointer-events-none" />
    </footer>
  );
};

export default Footer;
