import { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import
import { useZustandStore } from "../Zustandstore/useStore"; // <-- add


export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);
  const { authKey } = useAuthKey(); // <-- get authKey
  const availableUsdt = useZustandStore((s) => s.availableUsdt); // <-- add

  const welcomeMessage = "Welcome to SuperFlow Trading app!";
  const zeroBalanceMessage = "Welcome to Hyperliquid! Deposit Arbitrum USDT to get started.";

  const showZeroBalance = !!authKey && Number(availableUsdt) === 0; // <-- derive
  const displayMessage = showZeroBalance ? zeroBalanceMessage : (notification?.message || welcomeMessage);

  useEffect(() => {
    // Skip auto-clear when showing zero-balance prompt or when showing the welcome message
    if (!showZeroBalance && notification && notification.message !== welcomeMessage) {
      const timer = setTimeout(() => clearNotification(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification, showZeroBalance]);

  // Only render if connected (authKey exists)
  if (!authKey) return null;

  return (
    <div className="text-title border border-[1px] border-primary2dark w-full flex items-center bg-backgroundlight rounded-md my-1">
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
  );
}