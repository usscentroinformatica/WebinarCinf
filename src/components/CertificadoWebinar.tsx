// src/components/CertificadoWebinar.tsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoUss from '../assets/uss.png';

interface CertificadoProps {
  nombre: string;
  fecha: string;
  onClose: () => void;
}

const CertificadoWebinar: React.FC<CertificadoProps> = ({ nombre, fecha, onClose }) => {
  const certificadoRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

  const obtenerMes = (fechaStr: string) => {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fecha = new Date(fechaStr);
    return meses[fecha.getMonth()];
  };

  const obtenerAnio = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.getFullYear();
  };

  const mesActual = obtenerMes(fecha);
  const anioActual = obtenerAnio(fecha);
  const diaActual = new Date(fecha).getDate();
  const fechaFormateada = `${diaActual} de ${mesActual} del ${anioActual}`;

  const descargarPDF = async () => {
    if (!certificadoRef.current) return;
    setDescargando(true);
    try {
      const canvas = await html2canvas(certificadoRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificado_Webinar_${nombre.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', color: '#5a2290', marginBottom: '20px' }}>🎓 Tu Certificado Webinar</h2>
        
        <div ref={certificadoRef} style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '40px 45px', border: '8px solid #5a2290', borderRadius: '12px', background: 'white', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Times New Roman, serif' }}>
          <div style={{ position: 'absolute', inset: '12px', border: '2px solid #63ed12', borderRadius: '8px', pointerEvents: 'none' }} />
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src={logoUss} alt="USS" style={{ height: '60px', objectFit: 'contain' }} />
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '34px', fontWeight: 'bold', color: '#5a2290', margin: 0, letterSpacing: '4px', fontFamily: 'Times New Roman, serif' }}>CERTIFICADO</h1>
          </div>
          
          <div style={{ width: '80px', height: '3px', backgroundColor: '#63ed12', margin: '0 auto 16px' }} />
          
          <div style={{ textAlign: 'center', padding: '0 10px' }}>
            <p style={{ fontSize: '16px', color: '#333', marginBottom: '6px', fontFamily: 'Times New Roman, serif' }}>Se otorga el presente certificado a:</p>
            
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#5a2290', margin: '10px 0 14px', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '2px solid #63ed12', paddingBottom: '10px', display: 'inline-block', fontFamily: 'Times New Roman, serif' }}>
              {nombre.toUpperCase()}
            </h2>
            
            <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.9', textAlign: 'justify', fontFamily: 'Times New Roman, serif', marginTop: '10px' }}>
              Por haber participado en el Webinar <strong>“Transforma PowerPoint en una herramienta de presentaciones impactantes”</strong>,
              desarrollado por el <strong>Centro de Informática de la Universidad Señor de Sipán</strong>,
              realizado el <strong>{fechaFormateada}</strong>,
              con una duración de <strong>02 horas académicas</strong>,
              fortaleciendo sus competencias digitales en la creación de presentaciones profesionales,
              dinámicas e impactantes mediante el uso eficiente de Microsoft PowerPoint.
            </p>
          </div>
          
          <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #e0e0e0', paddingTop: '18px' }}>
            <p style={{ fontSize: '14px', color: '#555', margin: 0, fontFamily: 'Times New Roman, serif', fontStyle: 'italic' }}>
              <strong>Chiclayo, {fechaFormateada}</strong>
            </p>
            <div style={{ marginTop: '14px' }}>
              <div style={{ width: '220px', height: '1px', backgroundColor: '#333', margin: '0 auto 6px' }} />
              <p style={{ fontSize: '14px', color: '#333', margin: 0, fontWeight: '600', fontFamily: 'Times New Roman, serif' }}>Mag. Daniel Edgardo Salazar Lluén</p>
              <p style={{ fontSize: '12px', color: '#666', margin: 0, fontFamily: 'Times New Roman, serif' }}>Jefe del Centro de Informática</p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button onClick={descargarPDF} disabled={descargando} style={{ padding: '14px 40px', backgroundColor: descargando ? '#ccc' : '#63ed12', color: descargando ? '#999' : '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: descargando ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}>
            {descargando ? '⏳ Generando...' : '📥 Descargar PDF'}
          </button>
          <button onClick={onClose} style={{ padding: '14px 40px', backgroundColor: '#5a2290', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            ✖️ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificadoWebinar;