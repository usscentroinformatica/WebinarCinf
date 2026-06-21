// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Formulario from './pages/Formulario'
import AdminPanel from './pages/Admin/AdminPanel'
import EncuestaWebinar from './components/EncuestaWebinar'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Ruta principal - Pantalla de selección */}
        <Route path="/" element={<EncuestaWebinar />} />
        
        {/* Ruta de login para estudiantes USS */}
        <Route path="/login" element={<Login />} />
        
        {/* Ruta del formulario de registro (USS y Externo) */}
        <Route path="/formulario" element={<Formulario />} />
        
        {/* Ruta del panel de administración */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Redirigir rutas no encontradas */}
        <Route path="*" element={<EncuestaWebinar />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)