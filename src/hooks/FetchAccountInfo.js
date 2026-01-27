import Cookies from "js-cookie";

// Fetches account info from the server and returns the relevant fields
export async function fetchAccountInformation() {
  const authKey = Cookies.get("authKey");
  if (!authKey) {
    return { ok: false, status: 401, availableForOrder: 0 };
  }
  const response = await fetch('https://fastify-serverless-function-ymut.onrender.com/api/account-information', {
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'accept': 'application/json'
    }
  });
  const data = await response.json();

  // Return only the relevant fields
  return {
    ok: response.ok,
    status: response.status,
    walletBalance: data.walletBalance,
    positionMode: data.positionMode,
    crossPendingInitialMargin: data.crossPendingInitialMargin,
    crossMaintenanceMargin: data.crossMaintenanceMargin,
    realizedPnl: data.realizedPnl,
    crossInitialMargin: data.crossInitialMargin,
    upnl: data.upnl,
    marginBalance: data.marginBalance,
    availableForOrder: data.availableForOrder,
    paidFee: data.paidFee,
    positions: data.positions
  };
}