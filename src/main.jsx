import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles.css';
import './styles/nurse-ui.css';
import './styles/glass.css';
import './styles/admin-ns.css';
import './styles/admin-dashboard.css';
import { DEMO_MODE } from './lib/firebase';
import { hydrateDemoPhotos } from './lib/demoStore';

// In demo mode, put saved facility photos back before the first render.
const ready = DEMO_MODE ? hydrateDemoPhotos() : Promise.resolve();

ready.finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

// Register the service worker (production builds only, so dev hot-reload is never cached).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
