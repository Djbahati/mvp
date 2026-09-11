/**
 * Registers the Kofi Wallet Service Worker for offline IndexedDB caching and sync support.
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' || 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[Service Worker] Registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[Service Worker] Registration failed:', error);
        });
    });
  }
}
