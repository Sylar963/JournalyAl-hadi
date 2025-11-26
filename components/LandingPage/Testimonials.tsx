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
    <section className="py-24 bg-[#0c0c0e] border-t border-white/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Trusted by High Performers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div key={index} className="p-8 rounded-2xl bg-[#151518] energy-border relative">
              <div className="text-green-500 text-4xl font-serif absolute top-4 left-4 opacity-20">"</div>
              <p className="text-gray-300 mb-6 relative z-10 italic">
                {item.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
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
