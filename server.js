// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);
const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

app.post('/api/enviar-certificado', upload.single('pdf'), async (req, res) => {
  try {
    const { email, nombre } = req.body;
    const pdfFile = req.file;
    
    console.log('📧 Recibiendo solicitud:', { email, nombre });
    
    if (!email || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: email o nombre'
      });
    }
    
    let pdfBase64 = '';
    if (pdfFile) {
      pdfBase64 = pdfFile.buffer.toString('base64');
      console.log(`📄 PDF recibido: ${pdfFile.originalname} (${pdfFile.size} bytes)`);
    }
    
    const pythonScript = path.join(__dirname, 'send_certificate.py');
    
    if (!fs.existsSync(pythonScript)) {
      return res.status(500).json({
        success: false,
        error: 'Script Python no encontrado'
      });
    }
    
    const comando = `python "${pythonScript}" "${email}" "${nombre}" "${pdfBase64}"`;
    console.log('📡 Ejecutando Python...');
    
    const { stdout, stderr } = await execPromise(comando);
    console.log('📥 Salida Python:', stdout);
    
    if (stderr) {
      console.error('❌ Error Python:', stderr);
    }
    
    const lines = stdout.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    
    try {
      const result = JSON.parse(lastLine);
      if (result.success) {
        return res.json({
          success: true,
          message: result.message || 'Correo enviado exitosamente'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Error enviando correo'
        });
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: stdout || 'Error en la ejecución del script'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor de correos funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de correos corriendo en http://localhost:${PORT}`);
  console.log(`📧 Endpoint: http://localhost:${PORT}/api/enviar-certificado`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});