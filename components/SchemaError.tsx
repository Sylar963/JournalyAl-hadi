
import React, { useState } from 'react';
import { SUPABASE_URL } from '../config';

interface SchemaErrorProps {
  title: string;
  message: React.ReactNode;
  sql: string;
}

const SchemaError: React.FC<SchemaErrorProps> = ({ title, message, sql }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const projectUrl = SUPABASE_URL || 'Not configured. Please set SUPABASE_URL as a project secret.';

  return (
    <div className="flex items-center justify-center h-full animate-fade-in">
      <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 max-w-3xl w-full mx-4">
        <h2 className="text-xl font-bold text-red-400">{title}</h2>
        <div className="text-gray-300 mt-3 space-y-2 text-sm leading-relaxed">{message}</div>
        
        <div className="mt-4 p-4 border border-yellow-500/30 bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-300 font-semibold">Verification Step</p>
            <p className="text-sm text-gray-300 mt-1">
                Please double-check that you are running the SQL on the correct Supabase project. The app is currently configured to connect to:
            </p>
            <code className="block text-yellow-200 bg-black/30 px-2 py-1.5 rounded mt-2 text-xs break-all">{projectUrl}</code>
            <p className="text-xs text-gray-400 mt-2">If this URL is incorrect or missing, please set the <strong>SUPABASE_URL</strong> secret for this project.</p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Run this SQL in your Supabase project's SQL Editor:
          </label>
          <div className="relative bg-black rounded-md border border-gray-700">
            <pre className="text-sm text-gray-200 p-4 overflow-x-auto">
              <code>{sql.trim()}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"
            >
              {copied ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>
        </div>
         <div className="mt-6 text-center">
            <button onClick={() => window.location.reload()} className="bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
                I've run the SQL, refresh the app
            </button>
        </div>
      </div>
    </div>
  );
};

export default SchemaError;