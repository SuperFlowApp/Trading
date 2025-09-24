import { API_BASE_URL } from '../config/api';

export async function loginUser({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/api/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username, password }).toString(),
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}