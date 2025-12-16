import { useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import { useAccountInfoStore } from "../hooks/ZustAccountInfo";


export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);
  const accountInfo = useAccountInfoStore((s) => s.accountInfo);

  // Track login state using window event
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {

    const handler = (e) => setIsLoggedIn(e.detail === true);
    window.addEventListener("userLoginStateChanged", handler);
    return () => window.removeEventListener("userLoginStateChanged", handler);
  }, []);

  const welcomeMessage = "Welcome to SuperFlow Trading app!";
  const zeroBalanceMessage = "Deposit Arbitrum USDT to get started.";

  // Use availableForOrder from accountInfo
  const availableForOrder = Number(accountInfo?.availableForOrder ?? 0);
  const showZeroBalance = isLoggedIn && availableForOrder === 0;
  const displayMessage = showZeroBalance ? zeroBalanceMessage : (notification?.message || welcomeMessage);

  useEffect(() => {
    // Skip auto-clear when showing zero-balance prompt or when showing the welcome message
    if (!showZeroBalance && notification && notification.message !== welcomeMessage) {
      const timer = setTimeout(() => clearNotification(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification, showZeroBalance]);

  // Only render if logged in AND balance is zero
  if (!isLoggedIn || availableForOrder > 0) return null;

  return (
    <div className="w-full px-1">
      <div className="text-body border border-[1px] border-primary2darker w-full flex items-center bg-backgroundlight rounded-md mt-1 px-2">
        <div className="flex items-center self-center max-w-[1900px] mx-auto w-full p-1">
          <span className="flex-1">{displayMessage}</span>
          {/* Hide close when showing zero-balance prompt or the default welcome */}
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