// Vercel serverless proxy — contourne le CORS de l'API HubSpot
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, method, endpoint, body } = req.body || {};
  const httpMethod = (method || 'POST').toUpperCase();
  const needsBody = !['GET', 'HEAD', 'DELETE'].includes(httpMethod);

  if (!token || !endpoint) {
    return res.status(400).json({ error: 'Paramètres manquants : token et endpoint requis' });
  }
  if (!endpoint.startsWith('https://api.hubapi.com/')) {
    return res.status(403).json({ error: 'Endpoint non autorisé' });
  }

  try {
    const fetchOptions = {
      method: httpMethod,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    if (needsBody && body != null) fetchOptions.body = JSON.stringify(body);

    const hsRes = await fetch(endpoint, fetchOptions);

    // HubSpot renvoie parfois du texte non-JSON (ex: 204, erreurs HTML) — on gère proprement
    let data;
    const ct = hsRes.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await hsRes.json();
    } else {
      const text = await hsRes.text();
      data = { _raw: text, status: hsRes.status };
    }
    return res.status(hsRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erreur proxy' });
  }
}
