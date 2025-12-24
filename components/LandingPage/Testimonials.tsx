import React from 'react';

const testimonials = [
  {
    quote: "This app completely changed how I view my daily stress. The data visualization is a game changer.",
    author: "Alex M.",
    role: "Day Trader"
  },
  {
    quote: "Finally, a journaling app that feels professional and sleek. It helps me stay grounded.",
    author: "Sarah K.",
    role: "Software Engineer"
  },
  {
    quote: "I love the dark mode and the intuitive design. It makes reflection feel like a high-value activity.",
    author: "James L.",
    role: "Product Manager"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-bg border-t border-white/10 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-heading font-medium text-center text-white mb-20 tracking-tight">Trusted by High Performers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div key={index} className="p-8 rounded-none border-l border-white/10 bg-white/5 backdrop-blur-sm relative hover:bg-white/10 transition-colors duration-300">
              <div className="text-white/20 text-4xl font-serif absolute top-6 right-6 opacity-50">"</div>
              <p className="text-gray-300 mb-6 relative z-10 italic">
                {item.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-zinc-600 flex items-center justify-center text-white font-bold text-sm">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{item.author}</h4>
                  <p className="text-gray-500 text-xs">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
