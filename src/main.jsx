import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Pastikan file css ini ada (bawaan Vite)
import { BrowserRouter } from 'react-router-dom' // <--- PENTING: Import Router

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- PENTING: Bungkus App dengan BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)