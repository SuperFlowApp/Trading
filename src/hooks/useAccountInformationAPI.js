export async function fetchAccountInformation(authKey) {
  const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information', {
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'accept': 'application/json'
    }
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}