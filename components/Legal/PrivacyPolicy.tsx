
import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl relative"
      >
        <div className="sticky top-0 z-10 glass-panel border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Privacy Policy</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 space-y-8 text-gray-300">
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">1. Introduction</h3>
            <p>Welcome to Deltajournal. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">2. Data We Collect</h3>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address and telephone number.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">3. How We Use Your Data</h3>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">4. Cookies and Analytics</h3>
            <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
            <p className="mt-2">We use Vercel Analytics to understand how our website is used. This service uses cookies to collect data such as page views and unique visitors, which helps us improve our user experience.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">5. Contact Us</h3>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us.</p>
          </section>
          
          <div className="pt-8 text-sm text-gray-500 border-t border-white/10">
            Last Updated: December 2025
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
