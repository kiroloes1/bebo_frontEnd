import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SystemSettingsProvider } from './context/shareInfo.jsx'

createRoot(document.getElementById('root')).render(
 <SystemSettingsProvider>

    <App />
 
  </SystemSettingsProvider>
)
