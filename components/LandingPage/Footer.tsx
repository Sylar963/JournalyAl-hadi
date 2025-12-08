import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-bg border-t border-white/10 py-12 text-sm font-mono">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500">
            &copy; {new Date().getFullYear()} Deltajournal. All rights reserved.
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
