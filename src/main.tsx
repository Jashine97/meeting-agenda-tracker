import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'   // ok if present; harmless with CDN too

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
