# send_certificate.py
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os
from datetime import datetime
import json
import base64

# 🔥 CREDENCIALES (reemplaza con las tuyas)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SMTP_USER = 'usscentroinformatica@gmail.com'
SMTP_PASSWORD = 'khgzjqzgkwsxerir'  # SIN ESPACIOS
EMAIL_FROM = 'usscentroinformatica@gmail.com'

def enviar_certificado(email_destino, nombre, pdf_base64=None):
    """
    Envía un certificado por correo electrónico
    """
    
    print(json.dumps({
        "debug": f"Intentando enviar a: {email_destino}",
        "usuario": SMTP_USER
    }))
    
    try:
        # Crear el mensaje
        mensaje = MIMEMultipart()
        mensaje['From'] = EMAIL_FROM
        mensaje['To'] = email_destino
        mensaje['Subject'] = f"🎓 Certificado de participación - {nombre}"
        
        # Cuerpo del correo en HTML
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .footer {{
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎓 Certificado de Participación</h1>
            </div>
            <div class="content">
                <h2>Estimado(a) <strong>{nombre}</strong>,</h2>
                
                <p>Nos complace adjuntar tu <strong>certificado de participación</strong> en el webinar.</p>
                
                <p>¡Felicidades por tu participación y dedicación!</p>
                
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    📄 El certificado se encuentra adjunto a este correo en formato PDF.
                </p>
                
                <hr style="margin: 20px 0; border: 1px solid #e0e0e0;">
                
                <p style="color: #888; font-size: 13px;">
                    Este es un correo automático, por favor no responder.
                </p>
            </div>
            <div class="footer">
                <p>© {datetime.now().year} Centro de Informática - Todos los derechos reservados</p>
                <p>Universidad Señor de Sipán</p>
            </div>
        </body>
        </html>
        """
        
        # Adjuntar el HTML
        mensaje.attach(MIMEText(html, 'html'))
        
        # Adjuntar el PDF si se proporciona
        if pdf_base64:
            try:
                pdf_bytes = base64.b64decode(pdf_base64)
                parte_pdf = MIMEBase('application', 'octet-stream')
                parte_pdf.set_payload(pdf_bytes)
                encoders.encode_base64(parte_pdf)
                parte_pdf.add_header(
                    'Content-Disposition',
                    f'attachment; filename=certificado-{nombre.replace(" ", "-")}.pdf'
                )
                mensaje.attach(parte_pdf)
                print(json.dumps({"info": f"PDF adjunto: {len(pdf_bytes)} bytes"}))
            except Exception as e:
                print(json.dumps({"warning": f"No se pudo adjuntar PDF: {str(e)}"}))
        
        # Enviar el correo
        print(json.dumps({"info": f"Conectando a {SMTP_SERVER}:{SMTP_PORT}..."}))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.send_message(mensaje)
        
        print(json.dumps({
            "success": True,
            "message": f"Correo enviado a {email_destino}"
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Uso: python send_certificate.py <email> <nombre> [pdf_base64]"
        }))
        sys.exit(1)
    
    email = sys.argv[1]
    nombre = sys.argv[2]
    pdf_base64 = sys.argv[3] if len(sys.argv) > 3 else None
    
    print(json.dumps({
        "info": f"Enviando certificado a: {email}",
        "participante": nombre,
        "tiene_pdf": bool(pdf_base64)
    }))
    
    enviar_certificado(email, nombre, pdf_base64)