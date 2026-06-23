// src/components/EncuestaWebinar.tsx
import React, { useState, useEffect } from 'react';
import logoUss from '../assets/uss.png';
import { getPeriodoActual } from '../services/authService';

// ============================================================
// COMPONENTE PRINCIPAL - SOLO PANTALLA DE SELECCIÓN
// ============================================================
const EncuestaWebinar: React.FC = () => {
  const [periodoActual, setPeriodoActual] = useState<string>('Cargando...');

  // Cargar el período desde Firebase
  useEffect(() => {
    const cargarPeriodo = async () => {
      try {
        const periodo = await getPeriodoActual();
        setPeriodoActual(periodo);
        console.log('📅 Período cargado:', periodo);
      } catch (error) {
        console.error('Error cargando período:', error);
        setPeriodoActual('WEBINAR NO CONFIGURADO');
      }
    };
    cargarPeriodo();
  }, []);

  // Función para redirigir al login de estudiantes USS
  const irALogin = () => {
    window.location.href = '/login';
  };

  // Función para redirigir al formulario de externos
  const irAFormularioExterno = () => {
    // Guardar en localStorage que es usuario externo
    localStorage.setItem('tipoUsuario', 'externo');
    window.location.href = '/formulario';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Roboto, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '6px solid #63ed12',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img src={logoUss} alt="Universidad Señor de Sipán" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} />
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '680px' }}>
          <div className="card-header" style={{ backgroundColor: '#5a2290', color: 'white', textAlign: 'center', border: 'none' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '400' }}>REGISTRO WEBINAR</h2>
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '500' }}>{periodoActual}</div>
          </div>
          <div className="card-body" style={{ padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '22px', color: '#202124', marginBottom: '16px' }}>Antes de comenzar...</h3>
              <p style={{ fontSize: '16px', color: '#5f6368', marginBottom: '32px', lineHeight: '1.6' }}>Selecciona tu tipo de usuario para continuar con el registro</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
              <button 
                onClick={irALogin} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '30px 20px', 
                  border: '2px solid #5a2290', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  width: '100%', 
                  background: 'transparent', 
                  color: '#5a2290', 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a2290';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#5a2290';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Estudiante USS</div>
                <div style={{ fontSize: '14px', color: '#5f6368', lineHeight: '1.5' }}>Ingresa con tu usuario institucional</div>
              </button>
              <button 
                onClick={irAFormularioExterno} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '30px 20px', 
                  border: '2px solid #63ed12', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  width: '100%', 
                  background: 'transparent', 
                  color: '#63ed12', 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#63ed12';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#63ed12';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
                <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Usuario Externo</div>
                <div style={{ fontSize: '14px', color: '#5f6368', lineHeight: '1.5' }}>Si no eres estudiante USS</div>
              </button>
            </div>
            <div className="mt-4 p-3 bg-light rounded text-center" style={{ fontSize: '14px', color: '#5f6368', marginTop: '30px' }}>
              El formulario se creó en el Centro de Informática de la Universidad Señor de Sipán
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EncuestaWebinar;