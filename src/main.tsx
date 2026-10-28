import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/schibsted-grotesk/latin-400.css'
import './styles.css'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import { AuthProvider } from './lib/auth'
import { api } from './lib/api'
import { loadGoogle } from './lib/google'

void api.stats().catch(() => undefined)

const signedIn = Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
if (!signedIn) void loadGoogle().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
