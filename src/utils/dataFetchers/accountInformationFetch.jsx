import { getAuthKey } from "../authKeyStorage";
import { accountInformation } from '../../Zustandstore/useStore';

export async function fetchAndStoreAccountInformation() {
  const authKey = getAuthKey();
  if (!authKey) {
    console.error("No authKey found in storage.");
    return;
  }

  try {
    const response = await fetch("https://fastify-serverless-function-rimj.onrender.com/api/account-information-direct", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${authKey}`,
      },
    });

    const data = await response.json();
    console.log("Account Information:", data);

    // Save to Zustand store
    const set = accountInformation.getState();
    set.setwalletBalance(data.walletBalance);
    set.setpositionMode(data.positionMode);
    set.setcrossPendingInitialMargin(data.crossPendingInitialMargin);
    set.setcrossMaintenanceMargin(data.crossMaintenanceMargin);
    set.setrealizedPnl(data.realizedPnl);
    set.setcrossInitialMargin(data.crossInitialMargin);
    set.setupnl(data.upnl);
    set.setmarginBalance(data.marginBalance);
    set.setavailableForOrder(data.availableForOrder);
    set.setpaidFee(data.paidFee);
    set.setpositions(data.positions);

    return data;
  } catch (error) {
    console.error("Failed to fetch account information:", error);
  }
}