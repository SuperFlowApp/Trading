import { BASE_URL } from "./server-basic-info";

export default async function handler(req, res) {
  const { symbol, limit } = req.query;
  if (!symbol) {
    res.status(400).json({ error: "Missing symbol parameter" });
    return;
  }
  try {
    const url = `${BASE_URL}/orderbook?symbol=${encodeURIComponent(symbol)}${limit ? `&limit=${encodeURIComponent(limit)}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orderbook data" });
  }
}