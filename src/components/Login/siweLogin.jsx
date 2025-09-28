import { useState } from "react";
import Modal from "../CommonUIs/modal/modal";
import {
  siweLogin,
  siweRegister,
} from "./siweService";

const EXPECTED_CHAIN_ID = 1;

export default function SiweAuth({ open, onClose, onSuccess }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connectWallet() {
    setError("");
    if (!window?.ethereum) {
      setError("No Ethereum provider found. Install MetaMask or a compatible wallet.");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const hexChainId = await window.ethereum.request({ method: "eth_chainId" });
    setAddress(accounts[0]);
    setChainId(parseInt(hexChainId, 16));
  }

  function ensureChain() {
    if (EXPECTED_CHAIN_ID && chainId && chainId !== EXPECTED_CHAIN_ID) {
      throw new Error(`Wrong network. Switch to chainId ${EXPECTED_CHAIN_ID} (current ${chainId}).`);
    }
  }

  async function onSubmit() {
    setBusy(true);
    setError("");
    try {
      ensureChain();
      if (mode === "login") {
        const token = await siweLogin(address, chainId);
        onSuccess(token);
        onClose();
      } else {
        await siweRegister(address, chainId, username);
        const token = await siweLogin(address, chainId);
        onSuccess(token);
        onClose();
      }
    } catch (e) {
      setError(e.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setBusy(true);
    setError("");
    try {
      ensureChain();
      await siweRegister(address, chainId, username);
      const token = await siweLogin(address, chainId);
      onSuccess(token);
      onClose();
    } catch (e) {
      setError(e.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("login")}  disabled={busy} style={{ fontWeight: mode === "login"  ? 700 : 400 }}>Login</button>
          <button onClick={() => setMode("signup")} disabled={busy} style={{ fontWeight: mode === "signup" ? 700 : 400 }}>Sign up</button>
        </div>

        <button onClick={connectWallet} disabled={busy}>Connect Wallet</button>

        {mode === "signup" && (
          <>
            <input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={busy}
            />
            <button onClick={handleRegister} disabled={!address || busy || !((username || "").trim() || address)}>
              {busy ? "Registering…" : "Register"}
            </button>
          </>
        )}

        <button onClick={onSubmit} disabled={!address || busy}>
          {busy ? "Signing…" : mode === "login" ? "Sign & Login" : "Sign, Register & Login"}
        </button>

        {address && <div style={{ opacity: 0.8, fontSize: 12 }}>Address: {address}</div>}
        {chainId != null && <div style={{ opacity: 0.8, fontSize: 12 }}>Chain ID: {chainId}</div>}
        {error && <div style={{ color: "#ff6b6b", fontSize: 12, whiteSpace: "pre-wrap" }}>{error}</div>}
      </div>
    </Modal>
  );
}
