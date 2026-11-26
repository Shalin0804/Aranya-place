import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// External photos (Unsplash, admin uploads) can disappear. Swap any image
// that fails to load for a self-hosted one instead of a broken icon.
const FALLBACK_IMAGE = '/images/room-fallback.jpg'
document.addEventListener('error', (e) => {
  const img = e.target
  if (img.tagName === 'IMG' && !img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE
}, true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
