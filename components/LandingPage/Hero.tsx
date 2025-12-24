import WarpBackground from './WarpBackground';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden bg-bg text-white h-screen flex flex-col items-center justify-center">
      {/* Background with Warp Effect */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <WarpBackground />
      </div>
      
      {/* Texture Overlay */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none opacity-20"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center h-full pt-20">
        {/* Massive Typography Hero */}
        <div className="text-center mb-12 select-none relative w-full max-w-7xl">
          <div className="relative">
             <h1 className="font-heading font-bold text-[12vw] leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 animate-fade-in mix-blend-overlay">
              DELTA
             </h1>
             <h1 className="font-heading font-bold text-[12vw] leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 animate-slide-up opacity-0 absolute top-0 left-0 w-full blur-sm" style={{ animationDelay: '0.2s' }}>
              DELTA
             </h1>
          </div>
          
          <h1 className="font-heading font-bold text-[12vw] leading-[0.8] tracking-tighter text-white/90 animate-slide-up opacity-0" style={{ animationDelay: '0.1s' }}>
            JOURNAL
          </h1>

          <p className="font-mono text-sm md:text-base text-zinc-400 mt-8 max-w-xl mx-auto uppercase tracking-widest opacity-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            [ Knowledge at Scale ]
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in opacity-0" style={{ animationDelay: '0.8s' }}>
          <button 
            onClick={onGetStarted}
            className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white rounded-full transition-all duration-300 backdrop-blur-md overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative font-mono text-sm tracking-wider">START CREATING</span>
          </button>
        </div>
      </div>

      {/* Footer / Status Line */}
      <div className="absolute bottom-10 left-0 w-full px-10 flex justify-between items-end text-xs font-mono text-zinc-500 z-20">
        <div>
           <span className="block text-zinc-700 mb-1">SYSTEM STATUS</span>
           <span className="flex items-center gap-2 text-green-500">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             OPERATIONAL
           </span>
        </div>
        <div className="text-right">
             <span className="block text-gray-700 mb-1">VERSION</span>
             <span>2.0.4 [BETA]</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
