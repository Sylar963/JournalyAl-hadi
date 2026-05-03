
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

(async () => {
  try {
    if (navigator.storage?.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  } catch (e) {}

  sessionStorage.setItem('app_loaded', '1');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
})();
