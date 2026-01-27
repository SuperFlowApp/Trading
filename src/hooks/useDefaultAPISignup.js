import { API_BASE_URL } from '../config/api';

export async function signupUser({ username, password }) {
  const response = await fetch(
    `https://fastify-serverless-function-ymut.onrender.com/api/create_user`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    }
  );
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}