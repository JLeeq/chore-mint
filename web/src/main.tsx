import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginSelect from './pages/LoginSelect.tsx'
import ParentLogin from './pages/App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import ChildLogin from './pages/ChildLogin.tsx'
import ChildDashboard from './pages/ChildDashboard.tsx'
import ChildUpload from './pages/ChildUpload.tsx'
import ChildHome from './pages/ChildHome.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginSelect />} />
        <Route path="/parent-login" element={<ParentLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/child-login" element={<ChildLogin />} />
        <Route path="/child-dashboard" element={<ChildDashboard />} />
        <Route path="/child" element={<ChildHome />} />
        <Route path="/upload" element={<ChildUpload />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
