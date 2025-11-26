import FluidBackground from './FluidBackground';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden bg-[#0c0c0e] text-white py-20 lg:py-32">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <FluidBackground />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-green-200">
          Master Your <br />
          <span className="text-white">Emotional Market</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Track your feelings like assets. Analyze trends, gain insights, and invest in your mental well-being with professional-grade tools.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
          <button 
            onClick={onGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-1"
          >
            Start Journaling
          </button>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all backdrop-blur-sm">
            View Demo
          </button>
        </div>

        {/* Connecting Line 1: Buttons to Image */}
        <div className="h-24 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-blue-500/30 mx-auto my-0 relative z-10"></div>

        {/* Abstract UI Preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent z-20 h-full w-full" />
          <div className="border border-white/10 rounded-xl bg-[#151518] p-2 shadow-2xl transform rotate-x-12 perspective-1000 relative z-10">
             <div className="rounded-lg overflow-hidden bg-[#0c0c0e] aspect-[16/9] relative flex items-center justify-center energy-border shadow-2xl">
                <img 
                  src="/dashboard-preview.png" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e]/50 to-transparent pointer-events-none" />
             </div>
          </div>
        </div>

        {/* Connecting Line 2: Image to Next Section */}
        <div className="h-24 w-px bg-gradient-to-b from-blue-500/30 via-blue-500/30 to-transparent mx-auto -mt-10 relative z-0"></div>
      </div>
    </section>
  );
};

export default Hero;
