// api/enviar-certificado.js
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { email, nombre, pdfBase64 } = await parseFormData(req);
    
    if (!email || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: email o nombre'
      });
    }
    
    // Configurar transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'usscentroinformatica@gmail.com',
        pass: 'khgzjqzgkwsxerir',
      },
    });
    
    // Crear el correo
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header"><h1>🎓 Certificado de Participación</h1></div>
        <div class="content">
            <h2>Estimado(a) <strong>${nombre}</strong>,</h2>
            <p>Nos complace adjuntar tu <strong>certificado de participación</strong> en el webinar.</p>
            <p>¡Felicidades por tu participación y dedicación!</p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">📄 El certificado se encuentra adjunto a este correo en formato PDF.</p>
            <hr style="margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="color: #888; font-size: 13px;">Este es un correo automático, por favor no responder.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Centro de Informática - Todos los derechos reservados</p>
            <p>Universidad Señor de Sipán</p>
        </div>
    </body>
    </html>
    `;
    
    const mailOptions = {
      from: 'usscentroinformatica@gmail.com',
      to: email,
      subject: `🎓 Certificado de participación - ${nombre}`,
      html: html,
    };
    
    if (pdfBase64) {
      mailOptions.attachments = [
        {
          filename: `certificado-${nombre.replace(/\s+/g, '-')}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ];
    }
    
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({
      success: true,
      message: `Correo enviado a ${email}`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}

// 🔥 FUNCIÓN PARA PARSEAR FORM DATA
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });
    
    const fields = {};
    let pdfBase64 = '';
    
    bb.on('field', (name, val) => {
      fields[name] = val;
    });
    
    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => {
        chunks.push(data);
      });
      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        pdfBase64 = buffer.toString('base64');
      });
    });
    
    bb.on('close', () => {
      resolve({
        email: fields.email,
        nombre: fields.nombre,
        pdfBase64: pdfBase64,
      });
    });
    
    bb.on('error', reject);
    req.pipe(bb);
  });
}