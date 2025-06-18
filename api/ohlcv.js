// filepath: c:\Users\User228\Desktop\Simple-2\TradingApp\api\ohlcv.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { symbol = "BTCUSDT", timeframe = 100, limit = 100 } = req.query;
  const BASE_URL = "https://meta-test.rasa.capital/mock-api";

  try {
    const response = await fetch(`${BASE_URL}/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
    const data = await response.json();

    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OHLCV data" });
  }
}