import { useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import { fetchAccountInformation } from "../hooks/FetchAccountInfo";
import Cookies from "js-cookie";

export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);

  const [availableForOrder, setAvailableForOrder] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Listen for login state changes
  useEffect(() => {
    const handler = (e) => setIsLoggedIn(e.detail === true);
    window.addEventListener("userLoginStateChanged", handler);
    setIsLoggedIn(!!Cookies.get("authKey"));
    return () => window.removeEventListener("userLoginStateChanged", handler);
  }, []);

  // Poll account info every 5 seconds if logged in
  useEffect(() => {
    let intervalId;
    async function fetchAndSet() {
      try {
        const result = await fetchAccountInformation();
        if (!result.ok) {
          setAvailableForOrder(0);
        } else {
          setAvailableForOrder(Number(result.availableForOrder ?? 0));
        }
      } catch {
        setAvailableForOrder(0);
      }
    }

    if (isLoggedIn) {
      fetchAndSet();
      intervalId = setInterval(fetchAndSet, 5000);
    } else {
      setAvailableForOrder(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

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