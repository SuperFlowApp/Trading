import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx"; // adjust path as needed

export default function TokenModal({ open, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, token } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 300 }}>
        <h2>Get Token</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ display: "block", marginBottom: 8, width: "100%" }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ display: "block", marginBottom: 8, width: "100%" }}
          />
          <button type="submit">Get Token</button>
          <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </form>
        {token && (
          <div style={{ marginTop: 16 }}>
            <strong>Token:</strong>
            <pre style={{ wordBreak: "break-all" }}>{token}</pre>
          </div>
        )}
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}