import { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import

const colorMap = {
  info: "var(--color-backgroundmid)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
  warning: "var(--color-warning)",
};

export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);
  const { authKey } = useAuthKey(); // <-- get authKey

  useEffect(() => {
    if (notification && notification.message !== "Welcome to SuperFlow Trading app!") {
      const timer = setTimeout(() => clearNotification(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Only render if connected (authKey exists)
  if (!authKey) return null;

  return (
    <div className="text-title w-full flex items-center bg-primary2normal rounded-md">
      <div className="flex items-center self-center max-w-[1900px] mx-auto w-full text-black p-1">
        <span className="flex-1">{notification?.message}</span>
        {notification?.message !== "Welcome to SuperFlow Trading app!" && (
          <button
            onClick={clearNotification}
            className="ml-2 text-lg bg-transparent border-none cursor-pointer"
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