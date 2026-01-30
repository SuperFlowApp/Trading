import { useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import useAuthStore from "../store/authStore"; // Import Zustand store
import useAccountStore from "../hooks/FetchAccountInfo"; // Import Zustand account store

export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);

  const accountInfo = useAccountStore((state) => state.accountInfo); // Subscribe to Zustand account store
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn); // Zustand store subscription for login state

  const [availableForOrder, setAvailableForOrder] = useState(0);

  // Update availableForOrder whenever accountInfo changes
  useEffect(() => {
    if (accountInfo && accountInfo.availableForOrder !== undefined) {
      setAvailableForOrder(Number(accountInfo.availableForOrder));
    } else {
      setAvailableForOrder(0);
    }
  }, [accountInfo]);

  const welcomeMessage = "Welcome to SuperFlow Trading app!";
  const zeroBalanceMessage = "Deposit Arbitrum USDT to get started.";

  const showZeroBalance = isLoggedIn && availableForOrder === 0;
  const displayMessage = showZeroBalance ? zeroBalanceMessage : (notification?.message || welcomeMessage);

  useEffect(() => {
    if (!showZeroBalance && notification && notification.message !== welcomeMessage) {
      const timer = setTimeout(() => clearNotification(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification, showZeroBalance]);

  if (!isLoggedIn || availableForOrder > 0) return null;

  return (
    <div className="w-full px-1">
      <div className="text-body border border-[1px] border-primary2darker w-full flex items-center bg-backgroundlight rounded-md mt-1 px-2">
        <div className="flex items-center self-center max-w-[1900px] mx-auto w-full p-1">
          <span className="flex-1">{displayMessage}</span>
          {!showZeroBalance && displayMessage !== welcomeMessage && (
            <button
              onClick={clearNotification}
              className="ml-2 bg-transparent border-none cursor-pointer"
              style={{ color: "inherit" }}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}