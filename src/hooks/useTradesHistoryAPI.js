import { API_BASE_URL } from '../config/api';

export async function fetchTradesHistory(authKey, symbol) {
  const response = await fetch(
    `https://fastify-serverless-function-ymut.onrender.com/api/trades-history?symbol=${encodeURIComponent(symbol)}`,
    {
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'accept': 'application/json'
      }
    }
  );
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}