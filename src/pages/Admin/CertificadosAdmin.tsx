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

interface CertificadosAdminProps {
  periodo: string;
}

const CertificadosAdmin: React.FC<CertificadosAdminProps> = ({ periodo }) => {
  const [registros, setRegistros] = useState<RegistroCertificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [config, setConfig] = useState({ scriptUrl: '', spreadsheetId: '' });
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<{ nombre: string; fecha: string } | null>(null);

  const extraerFechaPeriodo = (periodoStr: string) => {
    const partes = periodoStr.split(' ');
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mes = partes.find(p => meses.includes(p.toUpperCase()));
    const año = partes.find(p => /^\d{4}$/.test(p));
    return { mes: mes || '', año: año || '' };
  };

  const { mes, año } = extraerFechaPeriodo(periodo);
  const tituloPeriodo = mes && año ? `${mes} ${año}` : periodo;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('🔍 Cargando configuración...');
        const configRef = ref(db, 'webinar-config/config');
        const configSnap = await get(configRef);
        
        if (configSnap.exists()) {
          const configData = configSnap.val();
          console.log('📦 Configuración:', configData);
          
          setConfig({ 
            scriptUrl: configData.googleScriptUrl || '', 
            spreadsheetId: configData.spreadsheetId || '' 
          });
          
          if (configData.spreadsheetId && configData.googleScriptUrl) {
            // 🔥 CARGAR DATOS DIRECTAMENTE (SIN PROXY)
            await cargarDatosDirecto(configData.spreadsheetId, configData.googleScriptUrl);
          } else {
            setError('Falta configuración (spreadsheetId o scriptUrl)');
          }
        } else {
          setError('No hay configuración en Firebase');
        }
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // 🔥 NUEVO: CARGAR DATOS DIRECTAMENTE DEL APP SCRIPT (SIN PROXY)
  const cargarDatosDirecto = async (spreadsheetId: string, scriptUrl: string) => {
    try {
      console.log('📡 Llamando al App Script directamente...');
      
      // 🔥 URL DIRECTA
      const url = `${scriptUrl}?action=getRespuestas&spreadsheetId=${spreadsheetId}`;
      console.log('📡 URL directa:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Respuesta del App Script:', result);
      
      if (result.success && result.data) {
        const data = result.data;
        console.log(`📄 ${data.length} registros encontrados`);
        
        // 🔥 FILTRAR SOLO LOS QUE SOLICITAN CERTIFICADO
        const certificados = data
          .filter((row: any) => {
            const solicita = row['Solicita certificado']?.toString().toLowerCase().trim() || 'no';
            console.log(`🔍 ${row['Correo electrónico'] || 'sin email'} - Solicita: "${solicita}"`);
            return solicita === 'si';
          })
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
        
        console.log(`✅ ${certificados.length} certificados encontrados`);
        setRegistros(certificados);
      } else {
        console.error('❌ Error en la respuesta:', result);
        setError(result.error || 'Error al obtener los datos');
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error: ${error.message}`);
    }
  };

  const togglePagado = async (fila: number, valorActual: string) => {
    const nuevoValor = valorActual === 'SI' ? 'NO' : 'SI';
    setMensaje('');
    try {
      // 🔥 Para actualizar pagado, usamos el proxy (POST)
      const response = await fetch('/api/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'actualizarPagado',
          scriptUrl: config.scriptUrl,
          spreadsheetId: config.spreadsheetId,
          fila: fila,
          valor: nuevoValor
        })
      });
      const result = await response.json();
      if (result.success) {
        setMensaje(`✅ ${nuevoValor === 'SI' ? 'Pago confirmado' : 'Pago desmarcado'}`);
        setRegistros(prev => prev.map(r => r.fila === fila ? { ...r, pagado: nuevoValor } : r));
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (error: any) {
      setError(`❌ ${error.message}`);
    }
  };

  const totalSolicitudes = registros.length;
  const pagados = registros.filter(r => r.pagado === 'SI').length;
  const pendientes = totalSolicitudes - pagados;

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
      {/* ENCABEZADO CON PERÍODO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0'
      }}>
        <div>
          <h2 style={{ color: '#5a2290', margin: 0, fontSize: '22px' }}>
            📜 Certificados
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>
            Período: <strong style={{ color: '#5a2290' }}>{tituloPeriodo}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5a2290' }}>{totalSolicitudes}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#63ed12' }}>{pagados}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>✅ Pagados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6d00' }}>{pendientes}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>⏳ Pendientes</div>
          </div>
        </div>
      </div>

      {mensaje && <div style={{ padding: '12px 16px', backgroundColor: '#e8f5e1', color: '#1a5e20', borderRadius: '8px', marginBottom: '16px' }}>{mensaje}</div>}
      {error && <div style={{ padding: '12px 16px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {registros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '12px', color: '#666' }}>
          <p style={{ fontSize: '18px' }}>📭 No hay solicitudes de certificado para este período</p>
          <p style={{ fontSize: '14px' }}>Los estudiantes que soliciten certificado aparecerán aquí</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#5a2290', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Participante</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre para Certificado</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Curso</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>✅ Pagado</th>
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
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => togglePagado(registro.fila, registro.pagado)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: `2px solid ${registro.pagado === 'SI' ? '#63ed12' : '#ccc'}`,
                        backgroundColor: registro.pagado === 'SI' ? '#63ed12' : 'white',
                        cursor: 'pointer',
                        fontSize: '18px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                      }}
                    >
                      {registro.pagado === 'SI' ? '✅' : '⬜'}
                    </button>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {registro.pagado === 'SI' ? (
                      <button
                        onClick={() => setCertificadoSeleccionado({
                          nombre: registro.nombreCertificado || registro.nombre,
                          fecha: registro.fecha
                        })}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#5a2290',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#63ed12';
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#5a2290';
                          e.currentTarget.style.color = 'white';
                        }}
                      >
                        📄 Ver
                      </button>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                        ⏳ Marcar pago
                      </span>
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