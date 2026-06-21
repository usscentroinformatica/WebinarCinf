// src/components/CertificadoWebinar.tsx
import React, { useState } from 'react';
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

  // 🔥 OBTENER EL PERÍODO DESDE LOCALSTORAGE
  const obtenerPeriodo = () => {
    try {
      const webinarData = localStorage.getItem('webinar_data');
      if (webinarData) {
        const data = JSON.parse(webinarData);
        return data.periodo || 'Webinar de Capacitación';
      }
      return 'Webinar de Capacitación';
    } catch {
      return 'Webinar de Capacitación';
    }
  };

  // 🔥 FORMATEAR FECHA: "Chiclayo, mes del año"
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

  // 🔥 GENERAR TEXTO DEL WEBINAR
  const generarTextoWebinar = () => {
    const periodo = obtenerPeriodo();
    const fechaTexto = formatearFecha(fecha);
    
    return `Por haber participado en el ${periodo}, desarrollado por el Centro de Informática de la Universidad Señor de Sipán, realizado el ${fechaTexto}, con una duración de 02 horas académicas, fortaleciendo sus competencias digitales en la creación de presentaciones profesionales, dinámicas e impactantes mediante el uso eficiente de Microsoft PowerPoint.`;
  };

  const generarPDF = async () => {
    if (!nombre.trim()) {
      setErrorMsg('El nombre es obligatorio');
      return;
    }

    setGenerando(true);
    setErrorMsg('');

    try {
      // 1. Cargar la plantilla PDF
      const templateUrl = '/src/assets/certificado.pdf';
      console.log('📄 Cargando plantilla:', templateUrl);
      
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar la plantilla (${response.status})`);
      }
      
      const templateBytes = await response.arrayBuffer();
      console.log('✅ Plantilla cargada:', templateBytes.byteLength, 'bytes');
      
      // 2. Cargar el PDF
      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);
      
      // 3. Obtener la primera página
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      if (!firstPage) {
        throw new Error('El PDF no tiene páginas');
      }
      
      // 4. Dimensiones de la página
      const { width, height } = firstPage.getSize();
      console.log('📐 Dimensiones:', width, 'x', height);
      
      // 5. Cargar fuentes
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      
      // 🔥 6. DIBUJAR EL NOMBRE (MÁS ARRIBA)
      const nombreFontSize = 36;
      const nombreWidth = fontBold.widthOfTextAtSize(nombre, nombreFontSize);
      const nombreX = (width - nombreWidth) / 2;
      const nombreY = height - 240; // Subido
      
      console.log(`📝 Dibujando nombre en y=${nombreY}`);
      
      firstPage.drawText(nombre, {
        x: nombreX,
        y: nombreY,
        size: nombreFontSize,
        font: fontBold,
        color: rgb(0.35, 0.13, 0.56),
      });
      
      // 🔥 7. DIBUJAR EL TEXTO DEL WEBINAR
      const textoWebinar = generarTextoWebinar();
      const textFontSize = 11;
      const textX = 70;
      const textY = height - 360;
      const maxWidth = width - 140;
      
      // Dividir el texto en líneas
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
      
      // Dibujar cada línea
      const lineHeight = 18;
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
      
      // 🔥 8. DIBUJAR LA FECHA (Chiclayo, mes del año - A LA DERECHA)
      const fechaTexto = formatearFecha(fecha);
      const fechaFontSize = 16;
      const fechaWidth = fontBold.widthOfTextAtSize(fechaTexto, fechaFontSize);
      const fechaX = width - fechaWidth - 80;
      const fechaY = 150;
      
      console.log(`📅 Dibujando fecha "${fechaTexto}" en x=${fechaX}, y=${fechaY}`);
      
      firstPage.drawText(fechaTexto, {
        x: fechaX,
        y: fechaY,
        size: fechaFontSize,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      // 9. Guardar el PDF
      const pdfBytes = await pdfDoc.save();
      
      // 10. Descargar
      const arrayBuffer = new ArrayBuffer(pdfBytes.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(pdfBytes);
      
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log('✅ PDF generado exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setGenerando(false);
    }
  };

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
        padding: '30px',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#c5221f',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        <h2 style={{ 
          color: '#5a2290', 
          marginTop: 0,
          textAlign: 'center',
          fontSize: '22px'
        }}>
          🎓 Certificado
        </h2>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
            <strong>Participante:</strong>
          </p>
          <p style={{ 
            fontSize: '20px', 
            color: '#5a2290', 
            fontWeight: 'bold', 
            margin: 0,
            wordBreak: 'break-word'
          }}>
            {nombre}
          </p>
          <p style={{ fontSize: '14px', color: '#888', margin: '8px 0 0 0' }}>
            📅 {formatearFecha(fecha)}
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0', fontStyle: 'italic' }}>
            {obtenerPeriodo()}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ❌ {errorMsg}
          </div>
        )}

        <button
          onClick={generarPDF}
          disabled={generando}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: generando ? '#ccc' : '#5a2290',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: generando ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          {generando ? '⏳ Generando...' : '📥 Descargar Certificado'}
        </button>

        <p style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          Se usará la plantilla oficial del Centro de Informática
        </p>
      </div>
    </div>
  );
};

export default CertificadoWebinar;