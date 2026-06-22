// src/components/CertificadoWebinar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface CertificadoWebinarProps {
  nombre: string;
  fecha: string;
  onClose: () => void;
}

const CertificadoWebinar: React.FC<CertificadoWebinarProps> = ({ nombre, fecha, onClose }) => {
  const [generando, setGenerando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [cargandoVistaPrevia, setCargandoVistaPrevia] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const obtenerNombreWebinar = () => {
    try {
      const webinarData = localStorage.getItem('webinar_data');
      if (webinarData) {
        const data = JSON.parse(webinarData);
        return data.nombreWebinar || data.periodo || 'Webinar de Capacitación';
      }
      return 'Webinar de Capacitación';
    } catch {
      return 'Webinar de Capacitación';
    }
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return 'Chiclayo, 2026';
    
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    try {
      const fecha = new Date(fechaStr);
      const mes = meses[fecha.getMonth()];
      const año = fecha.getFullYear();
      return `Chiclayo, ${mes} del ${año}`;
    } catch {
      return 'Chiclayo, 2026';
    }
  };

  const formatearFechaCompleta = (fechaStr: string) => {
    if (!fechaStr) return '2026';
    
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    try {
      const fecha = new Date(fechaStr);
      const dia = fecha.getDate();
      const mes = meses[fecha.getMonth()];
      const año = fecha.getFullYear();
      return `${dia} de ${mes} de ${año}`;
    } catch {
      return '2026';
    }
  };

  // 🔥 FUNCIÓN PARA DIVIDIR EL NOMBRE EN NOMBRES Y APELLIDOS
  const dividirNombre = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    
    if (partes.length === 1) {
      return { nombres: nombreCompleto, apellidos: '' };
    }
    
    if (partes.length === 2) {
      return { nombres: partes[0], apellidos: partes[1] };
    }
    
    if (partes.length >= 3) {
      if (partes.length === 3) {
        return { nombres: partes[0], apellidos: `${partes[1]} ${partes[2]}` };
      }
      const nombres = partes.slice(0, 2).join(' ');
      const apellidos = partes.slice(2).join(' ');
      return { nombres, apellidos };
    }
    
    return { nombres: nombreCompleto, apellidos: '' };
  };

  const generarTextoWebinar = () => {
    const nombreWebinar = obtenerNombreWebinar();
    const fechaCompleta = formatearFechaCompleta(fecha);
    
    return `Por haber participado en el ${nombreWebinar}, desarrollado por el Centro de Informática de la Universidad Señor de Sipán, realizado el ${fechaCompleta}, con una duración de 02 horas académicas, fortaleciendo sus competencias digitales en la creación de presentaciones profesionales, dinámicas e impactantes mediante el uso eficiente de Microsoft PowerPoint.`;
  };

  const generarVistaPrevia = async () => {
    if (!nombre.trim()) {
      setErrorMsg('El nombre es obligatorio');
      setCargandoVistaPrevia(false);
      return;
    }

    setCargandoVistaPrevia(true);
    setErrorMsg('');

    try {
      const templateUrl = '/certificado.pdf';
      console.log('📄 Cargando plantilla:', templateUrl);
      
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar la plantilla (${response.status})`);
      }
      
      const templateBytes = await response.arrayBuffer();
      console.log('✅ Plantilla cargada:', templateBytes.byteLength, 'bytes');
      
      const bytes = new Uint8Array(templateBytes);
      const header = bytes.slice(0, 5);
      const isPDF = header[0] === 37 && header[1] === 80 && header[2] === 68 && header[3] === 70 && header[4] === 45;
      
      if (!isPDF) {
        throw new Error('El archivo no es un PDF válido (header incorrecto)');
      }
      
      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      if (!firstPage) {
        throw new Error('El PDF no tiene páginas');
      }
      
      const { width, height } = firstPage.getSize();
      console.log('📐 Dimensiones:', width, 'x', height);
      
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      
      // 🔥 DIVIDIR EL NOMBRE EN NOMBRES Y APELLIDOS
      const { nombres, apellidos } = dividirNombre(nombre);
      console.log('📝 Nombres:', nombres);
      console.log('📝 Apellidos:', apellidos);
      
      // ============================================================
      // 🔥 SECCIÓN 1: DIBUJAR EL NOMBRE (INDEPENDIENTE)
      // ============================================================
      const nombreFontSize = 30;
      const nombreY = height - 210; // 🔥 BAJADO UN POQUITO (antes 200)
      
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
      
      // ============================================================
      // 🔥 SECCIÓN 2: DIBUJAR EL TEXTO DEL WEBINAR (INDEPENDIENTE)
      // ============================================================
      const textoWebinar = generarTextoWebinar();
      const textFontSize = 12;
      const textX = 140;
      const textY = height - 290; // 🔥 FIJO, NO DEPENDE DEL NOMBRE
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
      
      // ============================================================
      // 🔥 SECCIÓN 3: DIBUJAR LA FECHA (INDEPENDIENTE)
      // ============================================================
      const fechaTexto = formatearFecha(fecha);
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
      
      const arrayBuffer = new ArrayBuffer(pdfBytes.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(pdfBytes);
      
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setCargandoVistaPrevia(false);
      
      console.log('✅ Vista previa generada exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      setErrorMsg(`Error: ${error.message}`);
      setCargandoVistaPrevia(false);
    }
  };

  const descargarPDF = async () => {
    setGenerando(true);
    
    try {
      if (!pdfUrl) {
        await generarVistaPrevia();
        setTimeout(() => {
          if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `certificado-${nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          setGenerando(false);
        }, 500);
        return;
      }

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `certificado-${nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setGenerando(false);
      
    } catch (error) {
      console.error('❌ Error al descargar:', error);
      setErrorMsg('Error al descargar el PDF');
      setGenerando(false);
    }
  };

  useEffect(() => {
    generarVistaPrevia();
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [nombre, fecha]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '95%',
        maxHeight: '95%',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={() => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#c5221f',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '15px'
        }}>
          <div>
            <h2 style={{ 
              color: '#5a2290', 
              margin: 0,
              fontSize: '20px'
            }}>
              🎓 Vista Previa del Certificado
            </h2>
            <p style={{ 
              fontSize: '13px', 
              color: '#666', 
              margin: '4px 0 0'
            }}>
              <strong>Participante:</strong> {nombre}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={descargarPDF}
              disabled={generando || cargandoVistaPrevia}
              style={{
                padding: '10px 24px',
                backgroundColor: (generando || cargandoVistaPrevia) ? '#ccc' : '#5a2290',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (generando || cargandoVistaPrevia) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {generando ? '⏳ Generando...' : '📥 Descargar PDF'}
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          minHeight: '500px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {cargandoVistaPrevia ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '500px',
              color: '#666'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #e0e0e0',
                borderTop: '4px solid #5a2290',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <p>Generando vista previa...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : errorMsg ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '500px',
              color: '#c5221f',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '18px' }}>❌ {errorMsg}</p>
              <button
                onClick={generarVistaPrevia}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: '#5a2290',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '500px',
                border: 'none',
                borderRadius: '8px'
              }}
              title="Vista previa del certificado"
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '500px',
              color: '#999'
            }}>
              <p>No se pudo generar la vista previa</p>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid #e0e0e0',
          marginTop: '15px',
          fontSize: '12px',
          color: '#888'
        }}>
          <div>
            <span>📅 {formatearFecha(fecha)}</span>
            <span style={{ marginLeft: '20px' }}>📄 {obtenerNombreWebinar()}</span>
          </div>
          <div>
            <span style={{ color: '#5a2290' }}>✓ Certificado generado con la plantilla oficial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoWebinar;