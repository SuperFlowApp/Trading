import { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";
import notificationStore from "../Zustandstore/notificationStore.js";

const colorMap = {
  info: "var(--color-backgroundmid)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
  warning: "var(--color-warning)",
};

export default function NotificationBar() {
  const notification = notificationStore((s) => s.notification);
  const clearNotification = notificationStore((s) => s.clearNotification);

  useEffect(() => {
    if (notification && notification.message !== "Welcome to SuperFlow Trading app!") {
      const timer = setTimeout(() => clearNotification(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Always render the bar, even for the default message
  return (
    <div
      className="w-full flex items-center px-4 py-2 rounded-md shadow"
      style={{
        background: colorMap[notification?.type] || "var(--color-backgroundmid)",
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
        minHeight: 36,
        fontWeight: 500,
        fontSize: 15,
        zIndex: 100,
      }}
    >
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
  );
}