// api/google-script.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Manejar GET
  if (req.method === 'GET') {
    try {
      const { scriptUrl, action, periodo, email } = req.query;
      
      console.log('📡 GET - scriptUrl:', scriptUrl);
      console.log('📡 GET - action:', action);
      console.log('📡 GET - periodo:', periodo);
      console.log('📡 GET - email:', email);
      
      if (!scriptUrl) {
        return res.status(400).json({ error: 'Falta scriptUrl' });
      }
      
      let targetUrl = scriptUrl;
      const params = [];
      
      // 🔥 IMPORTANTE: SOLO agregar parámetros que NO sean email
      // o si se necesita email, asegurarse de que sea válido
      if (action) params.push(`action=${encodeURIComponent(action)}`);
      if (periodo) params.push(`periodo=${encodeURIComponent(periodo)}`);
      
      // 🔥 SOLO agregar email si es necesario y es válido
      // Para crear hoja, NO se necesita email (según tu App Script)
      // Si se necesita para otra cosa, descomentar la línea de abajo
      // if (email) params.push(`email=${encodeURIComponent(email)}`);
      
      if (params.length > 0) {
        targetUrl += `?${params.join('&')}`;
      }
      
      console.log('📤 GET llamando a:', targetUrl);
      
      const response = await fetch(targetUrl);
      const data = await response.json();
      
      return res.status(200).json(data);
      
    } catch (error) {
      console.error('❌ Error GET:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Manejar POST
  if (req.method === 'POST') {
    try {
      const { scriptUrl, spreadsheetId, ...bodyData } = req.body;
      
      if (!scriptUrl) {
        return res.status(400).json({ error: 'Falta scriptUrl' });
      }
      
      let targetUrl = scriptUrl;
      
      if (spreadsheetId) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl += `${separator}spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      }
      
      console.log('📤 POST llamando a:', targetUrl);
      console.log('📦 spreadsheetId:', spreadsheetId);
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      console.log('📥 Respuesta POST:', data);
      
      return res.status(200).json(data);
      
    } catch (error) {
      console.error('❌ Error POST:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido' });
}