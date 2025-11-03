import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import ChildUpload from './pages/ChildUpload.tsx'
import ChildHome from './pages/ChildHome.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/child" element={<ChildHome />} />
        <Route path="/upload" element={<ChildUpload />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
