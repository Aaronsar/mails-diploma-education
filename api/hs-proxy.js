// Vercel serverless proxy — contourne le CORS de l'API HubSpot
export default async function handler(req, res) {
  // CORS headers pour autoriser les appels depuis notre domaine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, endpoint, body } = req.body || {};
  if (!token || !endpoint || !body) {
    return res.status(400).json({ error: 'Paramètres manquants : token, endpoint, body requis' });
  }

  // Sécurité : on n'autorise que les endpoints HubSpot
  if (!endpoint.startsWith('https://api.hubapi.com/')) {
    return res.status(403).json({ error: 'Endpoint non autorisé' });
  }

  try {
    const hsRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await hsRes.json();
    return res.status(hsRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erreur proxy' });
  }
}
