import CryptoJS from "crypto-js";

// Save credentials
export function saveApiCredentials({ apiKey, password }) {
  localStorage.setItem("apiKey", apiKey);
  localStorage.setItem("apiSecret", password); // password as secret for mock API
}

// Get credentials
export function getApiCredentials() {
  return {
    apiKey: localStorage.getItem("apiKey"),
    apiSecret: localStorage.getItem("apiSecret"),
  };
}

// Sign a request
export function signRequest({ method, endpoint, secret }) {
  const nonce = Date.now().toString();
  const payload = nonce + method + endpoint;
  const signature = CryptoJS.HmacSHA256(payload, secret).toString();
  return { nonce, signature };
}

export function signPayload({ payload, secret }) {
  return CryptoJS.HmacSHA256(payload, secret).toString();
}

// Or, for your specific API signature pattern:
export function createSignature({ nonce, method, endpoint, secret }) {
  const payload = nonce + method + endpoint;
  return CryptoJS.HmacSHA256(payload, secret).toString();
}

export async function loginUserApi(username, password) {
  const res = await fetch(
    `http://localhost:3001/api/token?username=${username}&password=${password}`,
    { method: "POST" }
  );
  return await res.json();
}

export async function signupUserApi(username, password) {
  const res = await fetch(
    `http://localhost:3001/api/create_user?username=${username}&password=${password}`,
    { method: "POST" }
  );
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { msg: text };
  }
}

export async function changePasswordApi({ accessToken, apiKey, oldPassword, newPassword }) {
  const nonce = Date.now().toString();
  const method = "POST";
  const endpoint = "/mock-api/change_password";
  const payload = nonce + method + endpoint;
  const signature = CryptoJS.HmacSHA256(payload, oldPassword).toString(CryptoJS.enc.Hex);

  const res = await fetch("http://localhost:3001/api/change_password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "API-NONCE": nonce,
      "API-SIGNATURE": signature,
      "API-KEY": apiKey,
    },
    body: JSON.stringify({
      new_password: newPassword,
      old_password: oldPassword,
    }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function fetchApiKeyApi({ token, nonce, signature }) {
  const res = await fetch(`http://localhost:3001/api/create_api_key?token=${token}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "API-NONCE": nonce,
      "API-SIGNATURE": signature,
      "Content-Type": "application/json",
    },
  });
  return await res.json();
}

export async function fetchAccountInfoApi({ apiKey, nonce, signature }) {
  const res = await fetch("http://localhost:3001/api/account-information", {
    method: "GET",
    headers: {
      "API-KEY": apiKey,
      "API-NONCE": nonce,
      "API-SIGNATURE": signature,
      accept: "application/json",
    },
  });
  return await res.json();
}

export async function fetchBalanceApi({ apiKey, nonce, signature }) {
  const res = await fetch("http://localhost:3001/api/balance", {
    method: "GET",
    headers: {
      "API-KEY": apiKey,
      "API-NONCE": nonce,
      "API-SIGNATURE": signature,
      accept: "application/json",
    },
  });
  return await res.json();
}
