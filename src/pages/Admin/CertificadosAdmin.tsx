// src/pages/Admin/CertificadosAdmin.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import CertificadoWebinar from '../../components/CertificadoWebinar';

interface RegistroCertificado {
  fila: number;
  email: string;
  nombre: string;
  nombreCertificado: string;
  curso: string;
  pead: string;
  solicitaCertificado: string;
  pagado: string;
  fecha: string;
}

const CertificadosAdmin: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroCertificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [config, setConfig] = useState({ scriptUrl: '', spreadsheetId: '' });
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<{ nombre: string; fecha: string } | null>(null);
  // ❌ ELIMINAR periodoActual
  // const [periodoActual, setPeriodoActual] = useState('WEBINAR NO CONFIGURADO');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const configRef = ref(db, 'webinar-config/config');
        const configSnap = await get(configRef);
        if (configSnap.exists()) {
          const configData = configSnap.val();
          setConfig({ scriptUrl: configData.googleScriptUrl || '', spreadsheetId: configData.spreadsheetId || '' });
          // ❌ ELIMINAR setPeriodoActual
          // setPeriodoActual(configData.periodo || 'WEBINAR NO CONFIGURADO');
          if (configData.spreadsheetId) {
            await cargarDatosHoja(configData.spreadsheetId);
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const cargarDatosHoja = async (spreadsheetId: string) => {
    try {
      const response = await fetch(`https://opensheet.elk.sh/${spreadsheetId}/Respuestas`);
      if (response.ok) {
        const data = await response.json();
        const certificados = data
          .filter((row: any) => row['Solicita certificado']?.toLowerCase() === 'si')
          .map((row: any, index: number) => ({
            fila: index + 2,
            email: row['Correo electrónico'] || '',
            nombre: row['Nombre completo'] || '',
            nombreCertificado: row['Nombre para certificado'] || row['Nombre completo'] || '',
            curso: row['Curso'] || '',
            pead: row['PEAD'] || '',
            solicitaCertificado: row['Solicita certificado'] || 'no',
            pagado: row['Pagado'] || 'NO',
            fecha: row['Marca temporal'] || new Date().toISOString()
          }));
        setRegistros(certificados);
      }
    } catch (error) {
      console.error('Error cargando hoja:', error);
      setError('Error al cargar la hoja de cálculo');
    }
  };

  const actualizarPagado = async (fila: number, valor: string) => {
    setMensaje('');
    try {
      const response = await fetch('/api/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'actualizarPagado', scriptUrl: config.scriptUrl, spreadsheetId: config.spreadsheetId, fila, valor })
      });
      const result = await response.json();
      if (result.success) {
        setMensaje(`✅ Estado actualizado a ${valor}`);
        setRegistros(prev => prev.map(r => r.fila === fila ? { ...r, pagado: valor } : r));
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (error: any) {
      setError(`❌ ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid #e0e0e0', borderTop: '5px solid #5a2290', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '16px', color: '#5a2290' }}>Cargando certificados...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#5a2290', marginBottom: '20px' }}>📜 Gestión de Certificados</h2>
      
      {mensaje && <div style={{ padding: '12px 16px', backgroundColor: '#e8f5e1', color: '#1a5e20', borderRadius: '8px', marginBottom: '16px' }}>{mensaje}</div>}
      {error && <div style={{ padding: '12px 16px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {registros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '12px', color: '#666' }}>
          <p style={{ fontSize: '18px' }}>📭 No hay solicitudes de certificado aún</p>
          <p style={{ fontSize: '14px' }}>Los estudiantes que soliciten certificado aparecerán aquí</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#5a2290', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Participante</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre Certificado</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Curso</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>PEAD</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Pagado</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, idx) => (
                <tr key={registro.fila} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '10px' }}>{idx + 1}</td>
                  <td style={{ padding: '10px' }}>{registro.nombre}</td>
                  <td style={{ padding: '10px' }}>{registro.nombreCertificado}</td>
                  <td style={{ padding: '10px' }}>{registro.curso}</td>
                  <td style={{ padding: '10px' }}>{registro.pead}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <select value={registro.pagado} onChange={(e) => actualizarPagado(registro.fila, e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', border: `2px solid ${registro.pagado === 'SI' ? '#63ed12' : '#ff6d00'}`, backgroundColor: registro.pagado === 'SI' ? '#e8f5e1' : '#fff3e0', fontWeight: '600', cursor: 'pointer' }}>
                      <option value="NO">❌ No pagado</option>
                      <option value="SI">✅ Pagado</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {registro.pagado === 'SI' ? (
                      <button onClick={() => setCertificadoSeleccionado({ nombre: registro.nombreCertificado || registro.nombre, fecha: registro.fecha })} style={{ padding: '8px 16px', backgroundColor: '#63ed12', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        📄 Ver Certificado
                      </button>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>⏳ Pendiente de pago</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {certificadoSeleccionado && (
        <CertificadoWebinar
          nombre={certificadoSeleccionado.nombre}
          fecha={certificadoSeleccionado.fecha}
          onClose={() => setCertificadoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default CertificadosAdmin;