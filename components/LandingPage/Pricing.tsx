import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingProps {
  onGetStarted: () => void;
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      let currentIndex = 0;
      setDisplayedText('');
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 150); // Typing speed
      return () => clearInterval(interval);
    }
  }, [isAnimating, text]);

  useEffect(() => {
    // Blinking cursor only during or shortly after animation? 
    // User asked for "like if they are being typed in real time". 
    // Usually terminal cursors always blink or blink when active.
    // I'll keep it blinking.
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  const handleHover = () => {
    if (!hasAnimated && !isAnimating) {
      setHasAnimated(true);
      setIsAnimating(true);
    }
  };

  return (
    <span 
      onMouseEnter={handleHover}
      className="font-mono text-white bg-gray-900 px-2 py-1 rounded border border-gray-700 mx-1 inline-block min-w-[3ch] text-center cursor-default transition-colors duration-300 hover:border-gray-500"
    >
       {displayedText}
       <span className={`${cursorVisible || isAnimating ? 'opacity-100' : 'opacity-0'} text-gray-400 font-bold ml-[1px]`}>_</span>
    </span>
  );
};

const Pricing: React.FC<PricingProps> = ({ onGetStarted }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free Tier",
      price: "$0",
      description: "For beginners exploring the platform.",
      subText: "forever free",
      features: [
        "4 Widgets",
        "3 Indicators / Chart",
        "Limited Timeframes"
      ],
      cta: "Start for Free",
      popular: false,
      tag: "FREE"
    },
    {
      name: "PRO Terminal",
      price: "Coming soon",
      description: "For traders that take it seriously.",
      subText: isAnnual ? "Stay tuned for launch" : "Stay tuned for launch",
      features: [
      ],
      cta: "Notify Me",
      popular: true,
      tag: "Most Popular",
      comingSoon: true
    }
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-bg">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gray-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 tracking-tight">
            Choose your <TypewriterText text="edge" /> in the market
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            Transparent pricing, no hidden fees. Focus on your trading while we handle the data.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-4 mb-16">
            <div className="bg-white/5 p-1 rounded-full flex items-center border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isAnnual ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isAnnual ? 'bg-gray-700 text-white shadow-lg shadow-gray-700/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
              </button>
            </div>
            <AnimatePresence>
              {isAnnual && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gray-800 text-gray-300 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-gray-600 tracking-widest"
                >
                  Save $359
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative group h-full`}
            >
              {/* Card Glow */}
              {plan.popular && (
                <div className="absolute inset-0 bg-gray-700/20 blur-[60px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              <div className={`
                relative h-full glass-panel energy-border rounded-3xl p-8 flex flex-col items-start text-left bg-black/40
                ${plan.popular ? 'border-gray-600 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'border-white/10'}
              `}>
                {plan.tag && (
                  <div className={`
                    absolute top-6 right-6 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md tracking-wider
                    ${plan.popular ? 'bg-gray-800 text-gray-200 border border-gray-600' : 'bg-white/10 text-gray-400 border border-white/10'}
                  `}>
                    {plan.tag}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xs font-mono text-gray-500 mb-4 tracking-widest">[{String(idx+1).padStart(2,'0')}] {plan.name.toUpperCase()}</h3>
                  <h4 className="text-3xl font-bold mb-4 font-heading">{plan.name}</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">{plan.description}</p>
                  
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-gray-500 text-xs font-mono uppercase tracking-tighter">{plan.subText}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className={`w-1.5 h-1.5 rounded-full ${plan.popular ? 'bg-gray-400 shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'bg-gray-600'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`
                    w-full py-4 rounded-full font-mono text-sm tracking-wider transition-all duration-300 relative overflow-hidden group/btn
                    ${plan.popular 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30'}
                    backdrop-blur-md
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative uppercase">{plan.cta}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer info/Discord */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 inline-flex flex-col sm:flex-row items-center gap-4 bg-black/40 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-[10px] font-bold border border-black/50 shadow-xl">
                <span>$</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-400 flex items-center justify-center text-[10px] font-bold border border-black/50 shadow-xl">
                <span>₿</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <p className="text-sm text-gray-400 font-mono tracking-tight">
              Annual Crypto payments accepted <a href="#" className="text-gray-300 hover:text-white transition-colors ml-2 font-bold underline decoration-gray-500 underline-offset-4">Get started in Discord →</a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
