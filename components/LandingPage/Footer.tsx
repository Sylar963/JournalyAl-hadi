import React from 'react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="bg-bg border-t border-white/10 py-12 text-sm font-mono">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500">
            &copy; {new Date().getFullYear()} Deltajournal. All rights reserved.
          </div>
          <div className="flex gap-8">
            <button onClick={onOpenPrivacy} className="text-gray-500 hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={onOpenTerms} className="text-gray-500 hover:text-white transition-colors">Terms of Service</button>
            <a href="mailto:contact@deltajournal.com" className="text-gray-500 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
