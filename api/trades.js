import { BASE_URL } from "./server-basic-info";

export default async function handler(req, res) {
  const { symbol = "BTCUSDT", limit = 100 } = req.query;
  try {
    const response = await fetch(
      `${BASE_URL}/trades?symbol=${symbol}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades" });
  }
}