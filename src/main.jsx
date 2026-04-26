import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n.js' // must run before any component imports useTranslation
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

// Two print modes share window.print():
//   .printing       — light/paper-friendly (Print button)
//   .printing-dark  — dark/digital, matches website (Download PDF button)
// The PDF button adds .printing-dark before calling window.print(); we
// only auto-add .printing when the dark variant isn't already requested.
window.addEventListener('beforeprint', () => {
  if (!document.body.classList.contains('printing-dark')) {
    document.body.classList.add('printing')
  }
})
window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing')
  document.body.classList.remove('printing-dark')
})

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
