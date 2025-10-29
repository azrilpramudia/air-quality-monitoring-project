export const herostyles = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-glow {0%,100%{box-shadow:0 0 20px rgba(6,182,212,.3)} 50%{box-shadow:0 0 35px rgba(6,182,212,.5)}}
  @keyframes slide-in {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fade-in {from{opacity:0} to{opacity:1}}
  .animate-float{animation:float 3.5s ease-in-out infinite}
  .animate-pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
  .animate-slide-in{animation:slide-in .5s ease-out;animation-fill-mode:both}
  .animate-fade-in{animation:fade-in .6s ease-out}
  .glass-effect{background:rgba(15,23,42,.6);backdrop-filter:blur(12px);border:1px solid rgba(148,163,184,.1)}
  .gradient-text{background:linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
`;