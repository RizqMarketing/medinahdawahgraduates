import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n.js' // must run before any component imports useTranslation
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

// Native print path — toggle `body.printing` so all the branded report rules
// (defined under body.printing in index.css) apply during print preview and
// "Save as PDF". The same class is added programmatically by the Download PDF
// button so both flows share one source of truth.
window.addEventListener('beforeprint', () => document.body.classList.add('printing'))
window.addEventListener('afterprint', () => document.body.classList.remove('printing'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
