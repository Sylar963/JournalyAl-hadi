import React from 'react';

const features = [
  {
    title: "Emotion Tracking",
    description: "Log your daily emotional states with precision. Use our intuitive interface to capture nuances in your feelings.",
    icon: "📈"
  },
  {
    title: "Data Visualization",
    description: "Visualize your emotional journey with professional-grade charts and trend lines. Spot patterns instantly.",
    icon: "📊"
  },
  {
    title: "Reflection Prompts",
    description: "Guided prompts help you dive deeper into the 'why' behind your feelings, fostering growth and self-awareness.",
    icon: "🧘"
  },
  {
    title: "Secure & Private",
    description: "Your emotional data is encrypted and private. We prioritize your security so you can journal with peace of mind.",
    icon: "🔒"
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-[#0c0c0e] relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Professional Tools for Your Mind</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to understand, track, and improve your emotional well-being.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group p-6 rounded-2xl bg-[#151518] energy-border transition-all duration-300 hover:bg-[#1a1a1e]">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting Line: Features to Testimonials */}
        <div className="h-24 w-px bg-gradient-to-b from-blue-500/30 via-blue-500/30 to-transparent mx-auto mt-16"></div>
      </div>
    </section>
  );
};

export default Features;
