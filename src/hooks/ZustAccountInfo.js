import { create } from 'zustand';
import Cookies from 'js-cookie';

// Async fetch function
export async function fetchAccountInformation(authKey) {
  const response = await fetch('https://fastify-serverless-function-ymut.onrender.com/api/account-information', {
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'accept': 'application/json'
    }
  });
  const data = await response.json();

  // Destructure all fields from the response
  const {
    walletBalance,
    positionMode,
    crossPendingInitialMargin,
    crossMaintenanceMargin,
    realizedPnl,
    crossInitialMargin,
    upnl,
    marginBalance,
    paidFee,
    positions
  } = data;

}

// Zustand store with update logic
export const useAccountInfoStore = create((set, get) => ({
  accountInfo: null,
  status: null,
  polling: false,
  // Fetch and update account info ONCE
  updateAccountInfo: async () => {
    const authKey = Cookies.get('authKey');
    if (!authKey) {
      set({ accountInfo: null, status: null });
      return;
    }
    try {
      const result = await fetchAccountInformation(authKey);
      if (result.status === 401) {
        Cookies.remove('authKey');
        Cookies.remove('username');
        set({ accountInfo: null, status: 401 });
        window.dispatchEvent(new CustomEvent("userLoginStateChanged", { detail: false }));
      } else if (!result.ok) {
        set({ accountInfo: null, status: result.status });
      } else {
        set({ accountInfo: result, status: result.status });
      }
    } catch {
      set({ accountInfo: null, status: null });
    }
  },
  // Start/stop polling are now no-ops for compatibility
  startPolling: () => {},
  stopPolling: () => {},
  _cleanup: null,
}));