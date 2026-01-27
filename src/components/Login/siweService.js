import { SiweMessage } from "siwe";
import { getAddress } from "ethers";
import { API_BASE_URL } from "../../config/api";

const DOMAIN = "fastify-serverless-function-rimj.onrender.com";
const ORIGIN = "https://fastify-serverless-function-ymut.onrender.com";
const EXPECTED_CHAIN_ID = 1;

export async function getFreshNonce(addr) {
  const r = await fetch(`https://fastify-serverless-function-ymut.onrender.com/api/siwe/nonce/${addr}`);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).nonce;
}

export function buildSiweMessage({ address, chainId, nonce }) {
  const now = new Date();
  const issuedAt = now.toISOString();
  const expirationTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const msg = new SiweMessage({
    domain: DOMAIN,
    address,
    statement: "Sign in to SYMMIO Hybrid Exchange",
    uri: ORIGIN,
    version: "1",
    chainId,
    nonce,
    issuedAt,
    expirationTime,
  });
  return { prepared: msg.prepareMessage(), issuedAt, expirationTime };
}

export async function personalSign(message, address) {
  return await window.ethereum.request({
    method: "personal_sign",
    params: [message, address],
  });
}

export async function postJSON(path, payload) {
  const res = await fetch(`https://fastify-serverless-function-ymut.onrender.com${path}`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  return { res, data, text };
}

export function ensureChain(chainId) {
  if (EXPECTED_CHAIN_ID && chainId && chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Wrong network. Switch to chainId ${EXPECTED_CHAIN_ID} (current ${chainId}).`);
  }
}

export async function siweLogin(address, chainId) {
  if (!address || !chainId) throw new Error("Wallet not connected");
  ensureChain(chainId);

  const checksum = getAddress(address);
  const nonce = await getFreshNonce(checksum);

  const { prepared, issuedAt, expirationTime } = buildSiweMessage({
    address: checksum,
    chainId,
    nonce,
  });

  const signature = await personalSign(prepared, checksum);

  const payload = {
    accountAddress: checksum,
    nonce,
    issuedAt,
    expirationTime,
    signature,
    chainId,
  };

  const { res, data, text } = await postJSON("/api/siwe/login", payload);
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}) ${typeof data === "string" ? data : text || ""}`);
  }
  return data;
}

export async function siweRegister(address, chainId, username) {
  if (!address || !chainId) throw new Error("Wallet not connected");
  ensureChain(chainId);

  const checksum = getAddress(address);
  const finalUsername = (username || `user_${checksum.slice(2, 8)}_${Date.now()}`).trim();

  const nonce = await getFreshNonce(checksum);

  const { prepared, issuedAt, expirationTime } = buildSiweMessage({
    address: checksum,
    chainId,
    nonce,
  });

  const signature = await personalSign(prepared, checksum);

  const payload = {
    accountAddress: checksum,
    nonce,
    issuedAt,
    expirationTime,
    signature,
    chainId,
    username: finalUsername,
  };

  const { res, data, text } = await postJSON("/api/siwe/register", payload);
  if (!res.ok) {
    throw new Error(`Register failed (${res.status}) ${typeof data === "string" ? data : text || ""}`);
  }
  return data;
}