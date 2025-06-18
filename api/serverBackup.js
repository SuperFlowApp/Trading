// Updated server.js
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://meta-test.rasa.capital/mock-api";
const BASE_WS_URL = "wss://meta-test.rasa.capital/mock-api/ws";

app.get("/api/ohlcv", async (req, res) => {
  const { symbol = "BTCUSDT", timeframe = 100, limit = 100 } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OHLCV data" });
  }
});

app.get("/api/orderbooks", async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/orderbook?symbol=${symbol}&limit=${limit}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orderbook data" });
  }
});

app.get("/api/ticker", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/ticker?symbol=${symbol}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticker data" });
  }
});

app.get("/api/markets", async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/markets`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch markets data" });
  }
});

app.get("/api/balance", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const response = await fetch(`https://meta-test.rasa.capital/mock-api/balance`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader, // forward the token
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

app.post("/api/create_user", async (req, res) => {
  const { username, password } = req.query;
  const url = `${BASE_URL}/create_user?username=${username}&password=${password}`;
  const response = await fetch(url, { method: "POST" });
  res.json(await response.json());
});

app.post("/api/token", async (req, res) => {
  const { username, password } = req.query;
  const body = `username=${username}&password=${password}`;
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  res.json(await response.json());
});

app.post("/api/change_password", async (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const apiKey = req.headers["api-key"];
  const { new_password, old_password } = req.body;

  if (!token || !new_password || !old_password || !apiKey) {
    return res.status(400).json({ error: "Missing token, new password, old password, or API key" });
  }

  // Generate a unique nonce for this request
  const nonce = req.headers["api-nonce"];
  const endpoint = "/mock-api/change_password";
  const signaturePayload = nonce + "POST" + endpoint;
  const signature = crypto.createHmac("sha256", old_password).update(signaturePayload).digest("hex");

  // Build the URL with old_password as query param
  const url = `${BASE_URL}/change_password?password=${encodeURIComponent(old_password)}`;

  console.log("nonce:", nonce);
  console.log("payload:", signaturePayload);
  console.log("signature:", signature);
  console.log("old_password (frontend):", old_password);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "API-NONCE": nonce,
        "API-SIGNATURE": signature,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_password }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

app.get("/api/account-information", async (req, res) => {
  try {
    // Debug: print incoming headers
    console.log("Proxy /api/account-information DEBUG:");
    console.log("Received headers:", req.headers);

    const nonce = req.headers["api-nonce"];
    const signature = req.headers["api-signature"];
    const apiKey = req.headers["api-key"]; // <-- get API-KEY

    if (!nonce || !signature || !apiKey) {
      return res.status(400).json({ error: "Missing API key, nonce or signature in request" });
    }

    const endpoint = "/mock-api/account-information";
    const response = await fetch(`https://meta-test.rasa.capital${endpoint}`, {
      method: "GET",
      headers: {
        "API-KEY": apiKey, // <-- forward API-KEY
        "API-NONCE": nonce,
        "API-SIGNATURE": signature,
        accept: "application/json",
      },
    });

    const text = await response.text();
    console.log("API response status:", response.status);
    console.log("API response body:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error fetching account information:", err);
    res.status(500).json({ error: "Failed to fetch account information" });
  }
});

app.get("/api/positions", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { limit = 20 } = req.query;
    const response = await fetch(
      `https://meta-test.rasa.capital/mock-api/positions?limit=${limit}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader, // forward the JWT
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

app.post("/api/leverage", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { symbol, leverage } = req.body;

    const response = await fetch("https://meta-test.rasa.capital/mock-api/leverage", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ symbol, leverage }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to set leverage" });
  }
});

app.listen(3001, () => console.log("Proxy server running on http://localhost:3001"));

// WebSocket Proxy
const wss = new WebSocket.Server({ port: 3002 });

wss.on("connection", (clientSocket, req) => {
  console.log("Client connected to WebSocket proxy.");

  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  const symbol = urlParams.get("symbol") || "BTCUSDT";

  let targetSocket;

  const connectToSymmioWebSocket = () => {
    if (targetSocket) {
      targetSocket.close(); // Close the previous connection if it exists
    }

    targetSocket = new WebSocket(`wss://meta-test.rasa.capital/ws/orderbook/${symbol}`);

    targetSocket.on("open", () => {
      console.log(`Connected to SYMMIO WebSocket for ${symbol}`);
    });

    targetSocket.on("message", (data) => {
      clientSocket.send(data); // Forward data to the client
    });

    targetSocket.on("close", () => {
      console.log(`SYMMIO WebSocket for ${symbol} closed.`);
      setTimeout(connectToSymmioWebSocket, 3000); // Retry connection after 3 seconds
    });

    targetSocket.on("error", (error) => {
      console.error("Error in SYMMIO WebSocket:", error);
      setTimeout(connectToSymmioWebSocket, 3000); // Retry connection after 3 seconds
    });

    clientSocket.on("close", () => {
      console.log("Client WebSocket connection closed.");
      targetSocket.close();
    });

    clientSocket.on("error", (error) => {
      console.error("Error in client WebSocket:", error);
      targetSocket.close();
    });
  };

  connectToSymmioWebSocket();
});

console.log("WebSocket proxy server running on ws://localhost:3002");