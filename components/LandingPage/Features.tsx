import React from 'react';

const features = [
  {
    title: "Emotional Alpha",
    description: "Track your psychological state alongside market movements. Identify the emotions that lead to your best and worst trades.",
    id: "01"
  },
  {
    title: "P&L Correlation",
    description: "Visualize the direct impact of your mood on your profit and loss. Data-driven insights to optimize your trading psychology.",
    id: "02"
  },
  {
    title: "Pre-Market Routine",
    description: "Structured journaling prompts to baseline your mental state before the opening bell. Enter the market with clarity.",
    id: "03"
  },
  {
    title: "Tilt Detection",
    description: "Real-time analysis to detect signs of emotional tilt. Get alerts to step away before you force a bad trade.",
    id: "04"
  },
  {
    title: "Trade Review",
    description: "Link specific journal entries to trade executions. specific feedback loops for continuous improvement.",
    id: "05"
  },
  {
    title: "Secure Vault",
    description: "Your trading edge is private. End-to-end encryption ensures your psychological data remains yours alone.",
    id: "06"
  }
];

const Features: React.FC = () => {
  return (
    <section className="bg-bg relative border-t border-white/10">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10">
           {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="group p-8 md:p-12 relative h-full min-h-[300px] flex flex-col justify-between hover:bg-white/5 transition-colors duration-300">
               <div className="flex justify-between items-start w-full mb-8">
                  {/* Icon placeholder or just spatial layout */}
                  <div className="text-white/20 group-hover:text-white/40 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L12 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M4 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="font-mono text-xs text-white/30">{feature.id}</span>
               </div>
               
               <div>
                 <h3 className="text-xl font-heading font-medium text-white mb-4">{feature.title}</h3>
                 <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                   {feature.description}
                 </p>
               </div>
            </div>
           ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10">
           {features.slice(3, 6).map((feature, index) => (
            <div key={index} className="group p-8 md:p-12 relative h-full min-h-[300px] flex flex-col justify-between hover:bg-white/5 transition-colors duration-300">
               <div className="flex justify-between items-start w-full mb-8">
                  <div className="text-white/20 group-hover:text-white/40 transition-colors">
                     {/* Different icon for variety */}
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                     </svg>
                  </div>
                  <span className="font-mono text-xs text-white/30">{feature.id}</span>
               </div>
               
               <div>
                 <h3 className="text-xl font-heading font-medium text-white mb-4">{feature.title}</h3>
                 <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                   {feature.description}
                 </p>
               </div>
            </div>
           ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
