export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ error: "Missing Authorization header" });
  }
  try {
    const response = await fetch('/api/account-information', {
      headers: {
        'Authorization': `Bearer ${authHeader}`,
        'accept': 'application/json'
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch account information" });
  }
}