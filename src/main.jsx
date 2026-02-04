import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 
import { HashRouter } from 'react-router-dom' // <--- UBAH DARI BrowserRouter KE HashRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter> {/* <--- UBAH DARI BrowserRouter KE HashRouter */}
      <App />
    </HashRouter>
  </React.StrictMode>,
)