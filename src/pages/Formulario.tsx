// src/pages/Formulario.tsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, get } from 'firebase/database';
import logoUss from '../assets/uss.png';
import { getPeriodoActual } from '../services/authService';

// ============================================================
// ICONOS SVG MEJORADOS
// ============================================================
const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a2290" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#63ed12" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a2290" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PlanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a2290" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill="#63ed12" />
    <path d="M30 50 L43 63 L70 37" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TeacherIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#63ed12" strokeWidth="2">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14v7" />
    <path d="M3 7v11l9 5 9-5V7" />
  </svg>
);

const LoadingIcon = () => (
  <div style={{ 
    width: '60px', 
    height: '60px', 
    border: '5px solid #e0e0e0',
    borderTop: '5px solid #5a2290',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
);

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Formulario() {
  const [datos, setDatos] = useState<any>(null);
  const [cursoSel, setCursoSel] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exitoModal, setExitoModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [solicitaCertificado, setSolicitaCertificado] = useState('no');
  const [comentarios, setComentarios] = useState('');
  const [esExterno, setEsExterno] = useState(false);
  const [nombreExterno, setNombreExterno] = useState('');
  const [correoExterno, setCorreoExterno] = useState('');
  // 🔥 NUEVOS ESTADOS PARA CERTIFICADO
  const [nombreCertificado, setNombreCertificado] = useState('');
  const [periodoActual, setPeriodoActual] = useState('WEBINAR NO CONFIGURADO');

  // Cargar configuración desde Firebase
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configRef = ref(db, 'webinar-config/config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          const config = snapshot.val();
          console.log('📊 Configuración cargada:', config);
          
          if (config.googleScriptUrl) {
            setApiUrl(config.googleScriptUrl);
          }
          
          if (config.spreadsheetId) {
            setSpreadsheetId(config.spreadsheetId);
          }
        }
      } catch (error) {
        console.error('Error cargando config:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    cargarConfiguracion();
  }, []);

  // 🔥 Cargar período actual
  useEffect(() => {
    const cargarPeriodo = async () => {
      try {
        const periodo = await getPeriodoActual();
        setPeriodoActual(periodo);
      } catch (error) {
        console.error('Error cargando período:', error);
      }
    };
    cargarPeriodo();
  }, []);

  // Cargar datos del localStorage
  useEffect(() => {
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    if (tipoUsuario === 'externo') {
      setEsExterno(true);
      return;
    }

    const saved = localStorage.getItem('webinar_data');
    if (!saved) {
      window.location.href = '/';
      return;
    }
    const parsed = JSON.parse(saved);
    const cursosPendientes = parsed.cursos.filter((c: any) => !c.completado);
    if (cursosPendientes.length === 0) {
      alert('🎉 ¡Ya has registrado todos tus cursos!');
      window.location.href = '/';
      return;
    }
    setDatos({ ...parsed, cursos: cursosPendientes });
    setCursoSel(cursosPendientes[0].curso);
    
    if (parsed.spreadsheetId && !spreadsheetId) {
      setSpreadsheetId(parsed.spreadsheetId);
    }
  }, []);

  if (configLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingIcon />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: '24px', fontSize: '18px', color: '#5a2290', fontWeight: '600' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (esExterno) {
    return <FormularioExterno 
      nombreExterno={nombreExterno}
      setNombreExterno={setNombreExterno}
      correoExterno={correoExterno}
      setCorreoExterno={setCorreoExterno}
      solicitaCertificado={solicitaCertificado}
      setSolicitaCertificado={setSolicitaCertificado}
      comentarios={comentarios}
      setComentarios={setComentarios}
      enviando={enviando}
      setEnviando={setEnviando}
      error={error}
      setError={setError}
      apiUrl={apiUrl}
      spreadsheetId={spreadsheetId}
      exitoModal={exitoModal}
      setExitoModal={setExitoModal}
    />;
  }

  if (!datos || !cursoSel) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingIcon />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: '24px', fontSize: '18px', color: '#5a2290', fontWeight: '600' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  const info = datos.cursos.find((c: any) => c.curso === cursoSel) || datos.cursos[0];
  
  return <FormularioUSS 
    datos={datos}
    cursoSel={cursoSel}
    setCursoSel={setCursoSel}
    info={info}
    solicitaCertificado={solicitaCertificado}
    setSolicitaCertificado={setSolicitaCertificado}
    comentarios={comentarios}
    setComentarios={setComentarios}
    enviando={enviando}
    setEnviando={setEnviando}
    error={error}
    setError={setError}
    apiUrl={apiUrl}
    spreadsheetId={spreadsheetId}
    exitoModal={exitoModal}
    setExitoModal={setExitoModal}
    nombreCertificado={nombreCertificado}
    setNombreCertificado={setNombreCertificado}
    periodoActual={periodoActual}
  />;
}

// ============================================================
// FORMULARIO PARA USUARIO EXTERNO (CON DISEÑO MEJORADO)
// ============================================================
function FormularioExterno({ 
  nombreExterno, setNombreExterno, 
  correoExterno, setCorreoExterno,
  solicitaCertificado, setSolicitaCertificado,
  comentarios, setComentarios,
  enviando, setEnviando,
  error, setError,
  apiUrl, spreadsheetId,
  exitoModal, setExitoModal
}: any) {

  const limpiarYEnviar = async () => {
    if (!nombreExterno.trim() || !correoExterno.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const registroData = {
        scriptUrl: apiUrl,
        spreadsheetId: spreadsheetId,
        email: correoExterno.trim(),
        nombre: nombreExterno.trim(),
        planestudio: 'Externo',
        curso: 'WEBINAR',
        pead: 'EXTERNO',
        docente: 'No aplica',
        tipoUsuario: 'Externo',
        solicitaCertificado: solicitaCertificado,
        nombreCertificado: solicitaCertificado === 'si' ? nombreExterno.trim() : '',
        comentarios: comentarios
      };

      const response = await fetch('/api/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registroData),
      });

      const result = await response.json();

      if (result.success) {
        setExitoModal(true);
        localStorage.removeItem('tipoUsuario');
        setTimeout(() => window.location.href = '/', 3000);
      } else {
        throw new Error(result.error || 'Error al registrar');
      }
    } catch (error: any) {
      setError(error.message || 'Error al registrar. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (exitoModal) {
    return <ModalExito mensaje="¡Registro Exitoso!" subtitulo="¡Te esperamos en el webinar!" />;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src={logoUss} alt="USS" style={styles.logo} />
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>REGISTRO WEBINAR</h1>
            <p style={styles.subtitle}>Usuario Externo</p>
          </div>

          <div style={styles.cardBody}>
            <button onClick={() => { localStorage.removeItem('tipoUsuario'); window.location.href = '/'; }} style={styles.backButton}>
              ← Volver al inicio
            </button>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.infoCard}>
              <h5 style={styles.infoTitle}>📋 Información del usuario externo</h5>

              <div style={styles.field}>
                <div style={styles.fieldIcon}><UserIcon /></div>
                <div style={styles.fieldContent}>
                  <label style={styles.fieldLabel}>Nombre completo *</label>
                  <input 
                    type="text" 
                    value={nombreExterno} 
                    onChange={(e) => setNombreExterno(e.target.value)} 
                    placeholder="Ingresa tu nombre completo" 
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.fieldIcon}><EmailIcon /></div>
                <div style={styles.fieldContent}>
                  <label style={styles.fieldLabel}>Correo electrónico *</label>
                  <input 
                    type="email" 
                    value={correoExterno} 
                    onChange={(e) => setCorreoExterno(e.target.value)} 
                    placeholder="ejemplo@email.com" 
                    style={styles.input} 
                  />
                </div>
              </div>
            </div>

            {/* Certificado */}
            <div style={styles.certificadoCard}>
              <h4 style={styles.certificadoTitle}>🏆 SOLICITAR CERTIFICADO WEBINAR - S/ 10.00</h4>
              <p style={styles.certificadoText}>¿Deseas solicitar certificado digital del webinar?</p>
              <div style={styles.radioGroup}>
                {['si', 'no'].map(opt => (
                  <label key={opt} style={{ ...styles.radioLabel, backgroundColor: solicitaCertificado === opt ? '#63ed12' : 'transparent', color: solicitaCertificado === opt ? 'white' : '#202124' }}>
                    <input type="radio" name="certificado" value={opt} checked={solicitaCertificado === opt} onChange={(e) => setSolicitaCertificado(e.target.value)} disabled={enviando} style={styles.radioInput} />
                    <span>{opt === 'si' ? 'Sí, solicito certificado (S/ 10.00)' : 'No, solo registro de asistencia'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div style={styles.comentariosCard}>
              <h4 style={styles.comentariosTitle}>💬 Déjanos tu opinión (opcional)</h4>
              <textarea 
                value={comentarios} 
                onChange={(e) => setComentarios(e.target.value)} 
                rows={3} 
                placeholder="¿Qué te pareció el webinar? ¿Alguna sugerencia para próximos eventos?" 
                style={styles.textarea} 
              />
            </div>

            <div style={styles.buttonRow}>
              <button onClick={() => { localStorage.removeItem('tipoUsuario'); window.location.href = '/'; }} disabled={enviando} style={styles.cancelButton}>Cancelar</button>
              <button onClick={limpiarYEnviar} disabled={enviando || !nombreExterno.trim() || !correoExterno.trim()} style={enviando || !nombreExterno.trim() || !correoExterno.trim() ? styles.submitButtonDisabled : styles.submitButton}>
                {enviando ? 'Registrando...' : 'Registrar Asistencia'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// FORMULARIO PARA ESTUDIANTE USS (CON DISEÑO MEJORADO)
// ============================================================
function FormularioUSS({ 
  datos, cursoSel, setCursoSel, info,
  solicitaCertificado, setSolicitaCertificado,
  comentarios, setComentarios,
  enviando, setEnviando,
  error, setError,
  apiUrl, spreadsheetId,
  exitoModal, setExitoModal,
  nombreCertificado, setNombreCertificado}: any) {

  const limpiarNombreCurso = (cursoCompleto: string) => {
    return cursoCompleto.replace(/\s*-\s*PEAD-[a-z]$/i, '').trim();
  };

  const enviarUSS = async () => {
    if (!apiUrl || !spreadsheetId) {
      setError('Error de configuración. Contacta al administrador.');
      return;
    }

    // Validar nombre para certificado si solicita
    if (solicitaCertificado === 'si' && !nombreCertificado.trim()) {
      setError('Por favor ingresa el nombre para el certificado');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const cursoLimpio = limpiarNombreCurso(info.curso);
      const registroData = {
        scriptUrl: apiUrl,
        spreadsheetId: spreadsheetId,
        email: datos.email,
        nombre: info.nombre,
        planestudio: info.planEstudio || '',
        curso: cursoLimpio,
        pead: info.pead,
        docente: info.docente,
        tipoUsuario: 'Estudiante USS',
        solicitaCertificado: solicitaCertificado,
        nombreCertificado: solicitaCertificado === 'si' ? nombreCertificado.trim() : '',
        comentarios: comentarios
      };

      const response = await fetch('/api/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registroData),
      });

      const result = await response.json();

      if (result.success) {
        const datosActualizados = { ...datos };
        const cursoIndex = datosActualizados.cursos.findIndex((c: any) => c.curso === cursoSel);
        if (cursoIndex !== -1) {
          datosActualizados.cursos[cursoIndex].completado = true;
        }

        const cursosPendientes = datosActualizados.cursos.filter((c: any) => !c.completado);

        if (cursosPendientes.length > 0) {
          localStorage.setItem('webinar_data', JSON.stringify({ ...datosActualizados, spreadsheetId }));
          setExitoModal(true);
          setTimeout(() => window.location.href = '/formulario', 3000);
        } else {
          setExitoModal(true);
          localStorage.removeItem('webinar_data');
          setTimeout(() => window.location.href = '/', 5000);
        }
      } else {
        throw new Error(result.error || 'Error al registrar');
      }
    } catch (error: any) {
      setError(error.message || 'Error al registrar. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (exitoModal) {
    const cursosPendientes = datos?.cursos.filter((c: any) => !c.completado) || [];
    const hayMasCursos = cursosPendientes.length > 1;
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <SuccessIcon />
          <h1 style={styles.modalTitle}>{hayMasCursos ? '¡Curso Registrado!' : '¡Registro Exitoso!'}</h1>
          <p style={styles.modalText}>{hayMasCursos ? `Has registrado ${limpiarNombreCurso(info?.curso || '')}` : '¡Te esperamos en el webinar!'}</p>
          <div style={styles.modalMessage}>{hayMasCursos ? 'Continúa con el siguiente curso' : 'Tu asistencia ha sido registrada exitosamente'}</div>
          {hayMasCursos && <p style={styles.modalPending}>Quedan {cursosPendientes.length} curso(s) por registrar</p>}
          <p style={styles.modalRedirect}>{hayMasCursos ? 'Cargando siguiente curso...' : 'Redirigiendo al inicio en 5 segundos...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <img src={logoUss} alt="USS" style={styles.logo} />
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>REGISTRO WEBINAR</h1>
            <p style={styles.subtitle}>Registro de Asistencia</p>
            <p style={styles.cursosCount}>{datos.cursos.length} curso(s) pendiente(s)</p>
          </div>

          <div style={styles.cardBody}>
            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.infoCard}>
              <h5 style={styles.infoTitle}>📋 Información del Estudiante</h5>

              {datos.cursos.length > 1 && (
                <div style={styles.selectContainer}>
                  <label style={styles.selectLabel}>Selecciona el curso a registrar</label>
                  <select 
                    value={cursoSel} 
                    onChange={e => { setCursoSel(e.target.value); setError(''); }} 
                    style={styles.select}
                  >
                    {datos.cursos.map((c: any) => (
                      <option key={c.curso} value={c.curso}>
                        {c.completado ? '✅ ' : '📝 '}{c.curso}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={styles.infoGrid}>
                <div style={{ ...styles.infoItem, backgroundColor: '#e8f5e1' }}>
                  <UserIcon /><span><strong>Estudiante:</strong> {info.nombre}</span>
                </div>
                <div style={{ ...styles.infoItem, backgroundColor: '#f0f7ff' }}>
                  <PlanIcon /><span><strong>Plan de Estudio:</strong> {info.planEstudio || 'No especificado'}</span>
                </div>
                <div style={{ ...styles.infoItem, backgroundColor: '#f0f7ff' }}>
                  <BookIcon /><span><strong>Curso:</strong> {limpiarNombreCurso(info.curso)}</span>
                </div>
                <div style={{ ...styles.infoItem, backgroundColor: '#e8f5e1' }}>
                  <TeacherIcon /><span><strong>PEAD:</strong> {info.pead}</span>
                </div>
                <div style={{ ...styles.infoItem, backgroundColor: '#f0f7ff' }}>
                  <TeacherIcon /><span><strong>Docente:</strong> {info.docente}</span>
                </div>
              </div>
            </div>

            {/* Certificado */}
            <div style={styles.certificadoCard}>
              <h4 style={styles.certificadoTitle}>🏆 SOLICITAR CERTIFICADO WEBINAR - S/ 10.00</h4>
              <p style={styles.certificadoText}>¿Deseas solicitar certificado digital del webinar?</p>
              <div style={styles.radioGroup}>
                {['si', 'no'].map(opt => (
                  <label key={opt} style={{ ...styles.radioLabel, backgroundColor: solicitaCertificado === opt ? '#63ed12' : 'transparent', color: solicitaCertificado === opt ? 'white' : '#202124' }}>
                    <input type="radio" name="certificado" value={opt} checked={solicitaCertificado === opt} onChange={(e) => setSolicitaCertificado(e.target.value)} disabled={enviando} style={styles.radioInput} />
                    <span>{opt === 'si' ? 'Sí, solicito certificado (S/ 10.00)' : 'No, solo registro de asistencia'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 🔥 NUEVO: Campo para nombre en certificado */}
            {solicitaCertificado === 'si' && (
              <div style={{
                marginBottom: '20px',
                padding: '16px 20px',
                backgroundColor: '#f0f7ff',
                borderRadius: '10px',
                border: '2px solid #5a2290'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📝</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5a2290', marginBottom: '4px' }}>
                      Nombre para el certificado *
                    </label>
                    <input 
                      type="text" 
                      value={nombreCertificado} 
                      onChange={(e) => setNombreCertificado(e.target.value)} 
                      placeholder="Ingresa el nombre que aparecerá en tu certificado" 
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #dadce0', borderRadius: '6px', fontSize: '15px', backgroundColor: 'white' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      💡 Este nombre aparecerá impreso en tu certificado digital
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Comentarios */}
            <div style={styles.comentariosCard}>
              <h4 style={styles.comentariosTitle}>💬 Déjanos tu opinión (opcional)</h4>
              <textarea 
                value={comentarios} 
                onChange={(e) => setComentarios(e.target.value)} 
                rows={3} 
                placeholder="¿Qué te pareció el webinar? ¿Alguna sugerencia para próximos eventos?" 
                style={styles.textarea} 
              />
            </div>

            <div style={styles.buttonRow}>
              <button onClick={() => { localStorage.removeItem('webinar_data'); window.location.href = '/'; }} disabled={enviando} style={styles.cancelButton}>Cancelar</button>
              <button onClick={enviarUSS} disabled={enviando} style={enviando ? styles.submitButtonDisabled : styles.submitButton}>
                {enviando ? 'Registrando...' : 'Registrar Asistencia'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// MODAL DE ÉXITO
// ============================================================
function ModalExito({ mensaje, subtitulo }: { mensaje: string; subtitulo: string }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <SuccessIcon />
        <h1 style={styles.modalTitle}>{mensaje}</h1>
        <p style={styles.modalText}>{subtitulo}</p>
        <div style={styles.modalMessage}>Tu asistencia ha sido registrada exitosamente</div>
        <p style={styles.modalRedirect}>Redirigiendo al inicio en 3 segundos...</p>
      </div>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '4px solid #63ed12',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  headerContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  logo: {
    height: '70px',
    objectFit: 'contain',
  },
  main: {
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '720px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#5a2290',
    color: 'white',
    padding: '28px 40px',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '400',
    letterSpacing: '1px',
  },
  subtitle: {
    marginTop: '8px',
    fontSize: '16px',
    opacity: 0.9,
  },
  cursosCount: {
    marginTop: '8px',
    fontSize: '14px',
    opacity: 0.8,
  },
  cardBody: {
    padding: '32px 40px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#5a2290',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  errorBox: {
    marginBottom: '20px',
    padding: '14px 18px',
    backgroundColor: '#fce8e6',
    color: '#c5221f',
    borderRadius: '8px',
    border: '1px solid #f28b82',
  },
  infoCard: {
    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  infoTitle: {
    margin: '0 0 20px 0',
    fontSize: '17px',
    color: '#5a2290',
    fontWeight: '600',
  },
  selectContainer: {
    marginBottom: '20px',
  },
  selectLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#202124',
    marginBottom: '8px',
    fontWeight: '500',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #5a2290',
    backgroundColor: 'white',
    fontSize: '15px',
    appearance: 'none',
    cursor: 'pointer',
  },
  infoGrid: {
    display: 'grid',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  fieldIcon: {
    flexShrink: 0,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#5a2290',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #dadce0',
    borderRadius: '6px',
    fontSize: '15px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
  },
  certificadoCard: {
    padding: '20px 24px',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  certificadoTitle: {
    margin: '0 0 8px 0',
    color: '#5a2290',
    fontSize: '16px',
  },
  certificadoText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontSize: '14px',
  },
  radioInput: {
    transform: 'scale(1.4)',
    accentColor: '#63ed12',
    cursor: 'pointer',
  },
  comentariosCard: {
    padding: '20px 24px',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  comentariosTitle: {
    margin: '0 0 12px 0',
    color: '#5a2290',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '80px',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '12px 28px',
    border: '1px solid #dadce0',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#5a2290',
    transition: 'all 0.2s',
  },
  submitButton: {
    padding: '12px 36px',
    backgroundColor: '#5a2290',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButtonDisabled: {
    padding: '12px 36px',
    backgroundColor: '#f1f3f4',
    color: '#9aa0a6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '50px 40px',
    borderRadius: '20px',
    textAlign: 'center',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    color: '#5a2290',
    fontSize: '32px',
    margin: '20px 0 12px',
    fontWeight: '700',
  },
  modalText: {
    fontSize: '18px',
    color: '#555',
    marginBottom: '24px',
  },
  modalMessage: {
    backgroundColor: '#e8f5e1',
    padding: '16px',
    borderRadius: '12px',
    color: '#1a5e20',
    fontWeight: '600',
    fontSize: '15px',
  },
  modalPending: {
    marginTop: '16px',
    color: '#5a2290',
    fontSize: '15px',
  },
  modalRedirect: {
    marginTop: '24px',
    color: '#888',
    fontSize: '14px',
  },
};