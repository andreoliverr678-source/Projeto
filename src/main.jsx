import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pushNotifications'

// Force unregister any old Service Worker, then register new one fresh
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Unregister all existing SWs first to bust any stale cache
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    // Now re-register the current SW cleanly
    registerServiceWorker()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
