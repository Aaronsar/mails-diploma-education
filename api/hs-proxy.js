// Vercel Edge Function — runtime V8 (plus fiable que Node.js serverless pour les projets statiques)
export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });

  try {
    const { token, method, endpoint, body } = await req.json();

    if (!token || !endpoint) return new Response(JSON.stringify({ error: 'token et endpoint requis' }), { status: 400, headers: CORS });
    if (!endpoint.startsWith('https://api.hubapi.com/')) return new Response(JSON.stringify({ error: 'Endpoint non autorisé' }), { status: 403, headers: CORS });

    const httpMethod = (method || 'POST').toUpperCase();
    const fetchOptions = {
      method: httpMethod,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    if (!['GET', 'HEAD', 'DELETE'].includes(httpMethod) && body != null) {
      fetchOptions.body = JSON.stringify(body);
    }

    const hsRes = await fetch(endpoint, fetchOptions);
    const text = await hsRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }

    return new Response(JSON.stringify(data), {
      status: hsRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur' }), { status: 500, headers: CORS });
  }
}
