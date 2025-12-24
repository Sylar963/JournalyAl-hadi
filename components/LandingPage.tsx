import React from 'react';
import Hero from './LandingPage/Hero';
import Features from './LandingPage/Features';
import Pricing from './LandingPage/Pricing';
import Testimonials from './LandingPage/Testimonials';
import Footer from './LandingPage/Footer';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-bg text-white font-sans selection:bg-white/20 selection:text-white overflow-hidden relative">
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-black">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <path d="M12 4L3 20H21L12 4Z" />
              </svg>
            </div>
            <span>Delta<span className="text-gray-400">Journal</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button 
              onClick={onGetStarted}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Pricing onGetStarted={onGetStarted} />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default LandingPage;
