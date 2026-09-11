import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker';
import { initIndexedDB } from './services/indexedDbService';

// Initialize Service Worker & IndexedDB
registerServiceWorker();
initIndexedDB().catch((err) => console.warn('IndexedDB initial setup notice:', err));

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (String(event.reason?.message || event.reason).includes('WebSocket') ||
        String(event.reason?.message || event.reason).includes('ws://') ||
        String(event.reason?.message || event.reason).includes('wss://'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
