import Cookies from "js-cookie";
import { create } from "zustand";
import useAuthStore from "../store/authStore"; // Import the auth store

let intervalId = null;

// Zustand store for account info
const useAccountStore = create((set) => ({
  accountInfo: null, // Initial state
  setAccountInfo: (info) => set({ accountInfo: info }), // Action to update state
}));

// Fetches account info from the server
export async function fetchAccountInformation() {
  const authKey = Cookies.get("authKey");
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

// Start fetching account info periodically
async function startFetchingAccountInfo() {
  const { setAccountInfo } = useAccountStore.getState(); // Access Zustand's setAccountInfo action
  const { setLoginState } = useAuthStore.getState(); // Access Zustand's setLoginState action

  const fetchAndSetAccountInfo = async () => {
    const authKey = Cookies.get("authKey");
    if (!authKey) {
      setAccountInfo(null); // Clear account info
      setLoginState(false); // Set login state to false
      return;
    }

    try {
      const result = await fetchAccountInformation();
      if (result.status === 401) {
        Cookies.remove('authKey');
        Cookies.remove('username');
        setAccountInfo(null); // Clear account info
        setLoginState(false); // Set login state to false
      } else if (!result.ok) {
        setAccountInfo(null); // Clear account info
      } else {
        setAccountInfo(result); // Update Zustand store with fetched data
      }
    } catch (error) {
      setAccountInfo(null); // Clear account info in case of an error
    }
  };

  // Perform an immediate fetch
  await fetchAndSetAccountInfo();

  // Start the interval for periodic fetching
  if (!intervalId) {
    intervalId = setInterval(fetchAndSetAccountInfo, 5000); // Fetch every 5 seconds
  }
}

// Stop fetching account info
function stopFetchingAccountInfo() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    useAccountStore.getState().setAccountInfo(null); // Clear account info from Zustand store
  }
}

// Observe authStore's isLoggedIn state and start/stop fetching accordingly
useAuthStore.subscribe((state) => {
  if (state.isLoggedIn) {
    startFetchingAccountInfo();
  } else {
    stopFetchingAccountInfo();
  }
});

// Check login state on initialization (for page refresh)
const { isLoggedIn } = useAuthStore.getState();
if (isLoggedIn) {
  startFetchingAccountInfo();
}

export default useAccountStore;