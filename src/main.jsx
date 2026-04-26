import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n.js' // must run before any component imports useTranslation
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

// window.print() / Save-as-PDF path — toggle `body.printing` so the
// branded report stylesheet (.printing in index.css) applies for the
// duration of the print preview. Both Print and Download PDF buttons
// call window.print(), so they share one styling path.
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
