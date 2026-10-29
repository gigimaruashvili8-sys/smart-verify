import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.VITE_DEMO === 'true'
    ? <MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>
    : <BrowserRouter><App /></BrowserRouter>
)
