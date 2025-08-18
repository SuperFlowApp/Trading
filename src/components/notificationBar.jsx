import { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import


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
    <div className="text-title border border-[1px] border-primary2normal w-full flex items-center bg-backgroundlight rounded-md">
      <div className="flex items-center self-center max-w-[1900px] mx-auto w-full p-1">
        <span className="flex-1">{notification?.message}</span>
        {notification?.message !== "Welcome to SuperFlow Trading app!" && (
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