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
  cursos?: string[];
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
  const [hojaEliminada, setHojaEliminada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const extraerFechaPeriodo = (periodoStr: string) => {
    const partes = periodoStr.split(' ');
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mes = partes.find(p => meses.includes(p.toUpperCase()));
    const año = partes.find(p => /^\d{4}$/.test(p));
    return { mes: mes || '', año: año || '' };
  };

  const { mes, año } = extraerFechaPeriodo(periodo);
  const tituloPeriodo = mes && año ? `${mes} ${año}` : periodo;

  // 🔥 FUNCIÓN PARA AGRUPAR POR EMAIL
  const agruparPorEmail = (registros: any[]) => {
    const mapa = new Map();
    
    for (const registro of registros) {
      const email = registro.email;
      
      if (!mapa.has(email)) {
        mapa.set(email, {
          ...registro,
          cursos: [registro.curso],
          pagado: registro.pagado,
          fecha: registro.fecha
        });
      } else {
        const existente = mapa.get(email);
        if (!existente.cursos.includes(registro.curso)) {
          existente.cursos.push(registro.curso);
        }
        if (registro.pagado === 'SI') {
          existente.pagado = 'SI';
        }
        if (registro.fecha > existente.fecha) {
          existente.fecha = registro.fecha;
        }
      }
    }
    
    return Array.from(mapa.values());
  };

  // 🔥 FUNCIÓN PARA GENERAR PDF PARA ENVÍO (CORREGIDA)
const generarPDFParaEnvio = async (registro: RegistroCertificado): Promise<Blob> => {
  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const fontkit = await import('@pdf-lib/fontkit');
    
    const templateUrl = '/certificado.pdf';
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla (${response.status})`);
    }
    
    const templateBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit.default);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    if (!firstPage) {
      throw new Error('El PDF no tiene páginas');
    }
    
    const { width, height } = firstPage.getSize();
    
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    // Dividir nombre
    const nombreCompleto = registro.nombreCertificado || registro.nombre;
    const partes = nombreCompleto.trim().split(' ');
    let nombres = partes[0] || '';
    let apellidos = partes.slice(1).join(' ') || '';
    
    if (partes.length >= 3) {
      nombres = partes.slice(0, 2).join(' ');
      apellidos = partes.slice(2).join(' ');
    }
    
    // Dibujar nombres
    const nombreFontSize = 30;
    const nombreY = height - 210;
    
    if (nombres) {
      const nombreWidth = fontBold.widthOfTextAtSize(nombres, nombreFontSize);
      const nombreX = (width - nombreWidth) / 2;
      firstPage.drawText(nombres, {
        x: nombreX,
        y: nombreY,
        size: nombreFontSize,
        font: fontBold,
        color: rgb(0.35, 0.13, 0.56),
      });
    }
    
    if (apellidos) {
      const apellidosFontSize = 30;
      const apellidosWidth = fontBold.widthOfTextAtSize(apellidos, apellidosFontSize);
      const apellidosX = (width - apellidosWidth) / 2;
      const apellidosY = nombreY - 45;
      firstPage.drawText(apellidos, {
        x: apellidosX,
        y: apellidosY,
        size: apellidosFontSize,
        font: fontBold,
        color: rgb(0.35, 0.13, 0.56),
      });
    }
    
    // Obtener nombre del webinar
    let nombreWebinar = 'Webinar de Capacitación';
    try {
      const webinarData = localStorage.getItem('webinar_data');
      if (webinarData) {
        const data = JSON.parse(webinarData);
        nombreWebinar = data.nombreWebinar || data.periodo || 'Webinar de Capacitación';
      }
    } catch {}
    
    // Formatear fecha completa
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    let fechaCompleta = '2026';
    if (registro.fecha) {
      try {
        const fecha = new Date(registro.fecha);
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        fechaCompleta = `${dia} de ${mes} de ${año}`;
      } catch {}
    }
    
    // Texto del webinar
    const textoWebinar = `Por haber participado en el ${nombreWebinar}, desarrollado por el Centro de Informática de la Universidad Señor de Sipán, realizado el ${fechaCompleta}, con una duración de 02 horas académicas, fortaleciendo sus competencias digitales en la creación de presentaciones profesionales, dinámicas e impactantes mediante el uso eficiente de Microsoft PowerPoint.`;
    
    // Dibujar texto
    const textFontSize = 12;
    const textX = 140;
    const textY = height - 290;
    const maxWidth = width - 280;
    
    const palabras = textoWebinar.split(' ');
    let lineas = [];
    let lineaActual = '';
    
    for (const palabra of palabras) {
      const prueba = lineaActual + (lineaActual ? ' ' : '') + palabra;
      const anchoPrueba = fontNormal.widthOfTextAtSize(prueba, textFontSize);
      if (anchoPrueba <= maxWidth) {
        lineaActual = prueba;
      } else {
        if (lineaActual) lineas.push(lineaActual);
        lineaActual = palabra;
      }
    }
    if (lineaActual) lineas.push(lineaActual);
    
    const lineHeight = 20;
    let currentY = textY;
    for (const linea of lineas) {
      firstPage.drawText(linea, {
        x: textX,
        y: currentY,
        size: textFontSize,
        font: fontNormal,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= lineHeight;
    }
    
    // Fecha (Chiclayo, mes del año)
    let fechaTexto = 'Chiclayo, 2026';
    if (registro.fecha) {
      try {
        const fecha = new Date(registro.fecha);
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        fechaTexto = `Chiclayo, ${mes} del ${año}`;
      } catch {}
    }
    
    const fechaFontSize = textFontSize;
    const fechaWidth = fontNormal.widthOfTextAtSize(fechaTexto, fechaFontSize);
    const fechaX = width - fechaWidth - 140;
    const fechaY = 225;
    firstPage.drawText(fechaTexto, {
      x: fechaX,
      y: fechaY,
      size: fechaFontSize,
      font: fontNormal,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    const pdfBytes = await pdfDoc.save();
    
    // 🔥 CORREGIDO: Convertir Uint8Array a ArrayBuffer
    const arrayBuffer = new ArrayBuffer(pdfBytes.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(pdfBytes);
    return new Blob([arrayBuffer], { type: 'application/pdf' });
    
  } catch (error: any) {
    console.error('❌ Error generando PDF:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
};

  // 🔥 FUNCIÓN PARA ENVIAR CERTIFICADO POR CORREO
  const enviarPorCorreo = async (registro: RegistroCertificado) => {
    if (!registro.email) {
      alert('❌ El estudiante no tiene correo registrado');
      return;
    }

    const confirmar = confirm(`📧 ¿Enviar certificado a ${registro.email}?`);
    if (!confirmar) return;

    try {
      setEnviando(true);
      setMensaje(`📧 Enviando certificado a ${registro.email}...`);
      setError('');

      // Generar el PDF
      const pdfBlob = await generarPDFParaEnvio(registro);
      
      // Crear FormData
      const formData = new FormData();
      formData.append('email', registro.email);
      formData.append('nombre', registro.nombreCertificado || registro.nombre);
      formData.append('pdf', pdfBlob, `certificado-${registro.nombre}.pdf`);
      
      // Enviar al servidor Express
      const response = await fetch('/api/enviar-certificado', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMensaje(`✅ Certificado enviado exitosamente a ${registro.email}`);
        alert(`✅ Correo enviado a ${registro.email}`);
      } else {
        throw new Error(result.error || 'Error al enviar el correo');
      }
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(`❌ Error al enviar: ${error.message}`);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  // 🔥 CARGAR DATOS A TRAVÉS DEL PROXY
  const cargarDatosDesdeProxy = async (spreadsheetId: string, scriptUrl: string) => {
    try {
      console.log('📡 Llamando al App Script a través del proxy...');
      
      const url = `/api/google-script?scriptUrl=${encodeURIComponent(scriptUrl)}&action=getRespuestas&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      console.log('📡 URL del proxy:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Respuesta del proxy:', result);
      
      if (result.error) {
        const errorMsg = result.error.toLowerCase();
        console.log('🔍 Mensaje de error:', errorMsg);
        
        const erroresHojaEliminada = [
          'missing', 'deleted', 'document', 'exception', 
          'not found', 'no existe', 'spreadsheet', 'access',
          'no se pudo encontrar', '404'
        ];
        
        const esHojaEliminada = erroresHojaEliminada.some(palabra => errorMsg.includes(palabra));
        
        if (esHojaEliminada) {
          console.warn('⚠️ La hoja de cálculo fue eliminada o no existe');
          setRegistros([]);
          setHojaEliminada(true);
          setError('');
          setMensaje('📭 La hoja de cálculo fue eliminada. No hay certificados disponibles.');
          return;
        }
        
        setError(`❌ ${result.error}`);
        return;
      }
      
      if (!result.success || !result.data || result.data.length === 0) {
        console.warn('⚠️ No hay datos en la hoja');
        setRegistros([]);
        setHojaEliminada(false);
        setError('');
        setMensaje('📭 No hay solicitudes de certificado en la hoja actual');
        return;
      }
      
      const data = result.data;
      console.log(`📄 ${data.length} registros encontrados`);
      
      const certificados = data
        .filter((row: any) => {
          const solicita = row['Solicita certificado']?.toString().toLowerCase().trim() || 'no';
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
      
      console.log(`📊 ${certificados.length} registros antes de agrupar`);
      
      const certificadosAgrupados = agruparPorEmail(certificados);
      
      console.log(`✅ ${certificadosAgrupados.length} estudiantes únicos después de agrupar`);
      setRegistros(certificadosAgrupados);
      setHojaEliminada(false);
      setError('');
      
      if (certificadosAgrupados.length === 0) {
        setMensaje('📭 No hay solicitudes de certificado para este período');
      } else {
        setMensaje(`✅ ${certificadosAgrupados.length} estudiantes solicitaron certificado`);
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando datos desde proxy:', error);
      
      const errorMsg = error.message.toLowerCase();
      
      const erroresHojaEliminada = [
        'missing', 'deleted', 'document', 'exception', 
        'not found', 'no existe', 'spreadsheet', 'access',
        'no se pudo encontrar', '404'
      ];
      
      const esHojaEliminada = erroresHojaEliminada.some(palabra => errorMsg.includes(palabra));
      
      if (esHojaEliminada) {
        setRegistros([]);
        setHojaEliminada(true);
        setError('');
        setMensaje('📭 La hoja de cálculo fue eliminada. No hay certificados disponibles.');
      } else {
        setError(`❌ ${error.message}`);
        setHojaEliminada(false);
      }
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setHojaEliminada(false);
        setError('');
        setMensaje('');
        
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
            await cargarDatosDesdeProxy(configData.spreadsheetId, configData.googleScriptUrl);
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

  const togglePagado = async (fila: number, valorActual: string) => {
    const nuevoValor = valorActual === 'SI' ? 'NO' : 'SI';
    setMensaje('');
    setError('');
    try {
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

      {hojaEliminada ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8f9fa', borderRadius: '12px', color: '#666' }}>
          <p style={{ fontSize: '48px', margin: 0 }}>🗑️</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#c5221f', marginTop: '10px' }}>
            La hoja de cálculo fue eliminada
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            No hay certificados disponibles. Por favor, crea una nueva hoja desde el panel de configuración.
          </p>
        </div>
      ) : registros.length === 0 ? (
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
                <th style={{ padding: '12px', textAlign: 'left' }}>Cursos</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>✅ Pagado</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '10px' }}>{idx + 1}</td>
                  <td style={{ padding: '10px' }}>{registro.nombre}</td>
                  <td style={{ padding: '10px' }}>{registro.nombreCertificado}</td>
                  <td style={{ padding: '10px' }}>
                    {registro.cursos ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {registro.cursos.map((c: string, i: number) => (
                          <span key={i} style={{ 
                            backgroundColor: '#e8f0fe', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            color: '#1a237e'
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      registro.curso
                    )}
                  </td>
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
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setCertificadoSeleccionado({
                            nombre: registro.nombreCertificado || registro.nombre,
                            fecha: registro.fecha
                          })}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#5a2290',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
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
                        
                        {/* 🔥 BOTÓN ENVIAR CORREO */}
                        <button
                          onClick={() => enviarPorCorreo(registro)}
                          disabled={enviando}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: enviando ? '#ccc' : '#0d6efd',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: enviando ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!enviando) e.currentTarget.style.backgroundColor = '#0b5ed7';
                          }}
                          onMouseLeave={(e) => {
                            if (!enviando) e.currentTarget.style.backgroundColor = '#0d6efd';
                          }}
                        >
                          {enviando ? '⏳' : '📧'} {enviando ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
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