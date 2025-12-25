
import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl relative"
      >
        <div className="sticky top-0 z-10 glass-panel border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Terms of Service</h2>
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
            <h3 className="text-xl font-semibold text-white mb-4">1. Terms</h3>
            <p>By accessing the website at Deltajournal, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">2. Use License</h3>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on Deltajournal's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on Deltajournal's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">3. Disclaimer</h3>
            <p>The materials on Deltajournal's website are provided on an 'as is' basis. Deltajournal makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">4. Limitations</h3>
            <p>In no event shall Deltajournal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Deltajournal's website.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4">5. Governing Law</h3>
            <p>These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
          </section>
          
          <div className="pt-8 text-sm text-gray-500 border-t border-white/10">
            Last Updated: December 2025
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
