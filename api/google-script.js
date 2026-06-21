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
      // 🔥 EXTRAER TODOS LOS PARÁMETROS
      const { scriptUrl, ...params } = req.query;
      
      console.log('📡 GET - scriptUrl:', scriptUrl);
      console.log('📡 GET - todos los parámetros:', params);
      
      if (!scriptUrl) {
        return res.status(400).json({ error: 'Falta scriptUrl' });
      }
      
      // 🔥 CONSTRUIR LA URL CON TODOS LOS PARÁMETROS (EXCEPTO scriptUrl)
      let targetUrl = scriptUrl;
      const queryParams = [];
      
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          queryParams.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
      
      if (queryParams.length > 0) {
        targetUrl += `?${queryParams.join('&')}`;
      }
      
      console.log('📤 GET llamando a:', targetUrl);
      
      const response = await fetch(targetUrl);
      const data = await response.json();
      
      console.log('📥 Respuesta GET:', data);
      
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
      
      console.log('📡 POST - scriptUrl:', scriptUrl);
      console.log('📡 POST - spreadsheetId:', spreadsheetId);
      
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