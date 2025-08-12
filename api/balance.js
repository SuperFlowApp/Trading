export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const response = await fetch("https://superflow.exchange/balance", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader, // forward the token
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
}