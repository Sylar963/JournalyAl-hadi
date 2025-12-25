import React from 'react';
import Hero from './LandingPage/Hero';
import Features from './LandingPage/Features';
import Pricing from './LandingPage/Pricing';
import Testimonials from './LandingPage/Testimonials';
import Footer from './LandingPage/Footer';
import EmailCaptureModal from './EmailCaptureModal';
import { useI18n } from '../hooks/useI18n';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenPrivacy, onOpenTerms }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="min-h-screen w-full bg-bg text-white font-sans selection:bg-white/20 selection:text-white relative">
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-400 rounded-lg flex items-center justify-center text-black">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <path d="M12 4L3 20H21L12 4Z" />
              </svg>
            </div>
            <span>Delta<span className="text-gray-400">Journal</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">{t('nav.features')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('nav.testimonials')}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</a>
            
            <button 
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="px-3 py-1.5 border border-white/10 hover:border-white/30 rounded-md text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 group"
            >
              <span className={language === 'en' ? 'text-white font-bold' : 'text-gray-500'}>EN</span>
              <span className="text-gray-700">|</span>
              <span className={language === 'es' ? 'text-white font-bold' : 'text-gray-500'}>ES</span>
            </button>

            <button 
              onClick={onGetStarted}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              {t('nav.login')}
            </button>
          </div>
        </div>
      </nav>

      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Pricing 
        onGetStarted={onGetStarted} 
        onNotifyMe={() => setIsEmailModalOpen(true)}
      />
      <Testimonials />
      <Footer onOpenPrivacy={onOpenPrivacy} onOpenTerms={onOpenTerms} />
      
      <EmailCaptureModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;
