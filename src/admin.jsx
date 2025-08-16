import { useState, useEffect } from 'react';
import notificationStore from './Zustandstore/notificationStore.js';


export default function AdminPanel() {
  const notificationStoreState = notificationStore();
  const setNotification = notificationStore((s) => s.setNotification);
  // Extract just the notification message
  const notificationMessage =
    notificationStoreState?.notification?.message || 'No notification';

  // Click handler to update notification
  const handleNotificationClick = () => {
    const newMessage = window.prompt('Enter new notification message:', notificationMessage);
    if (newMessage !== null && newMessage.trim() !== '') {
      setNotification({ ...notificationStoreState.notification, message: newMessage });
    }
  };

  return (
    <div style={{ background: '#18181b', color: '#fff', minHeight: '100vh', padding: 32, justifyItems: 'center' }}>
      {/* Notification Panel */}
      <div
        style={{
          background: '#23272f',
          padding: 14,
          borderRadius: 4,
          marginBottom: 24,
          maxWidth: 600,
        }}
      >
        <h2 style={{ fontSize: 12, marginBottom: 8 }}>Notification</h2>
        <div
          style={{
            background: '#ffffff33',
            color: '#ffffffff',
            fontSize: 15,
            margin: 0,
            padding: 10,
            cursor: 'pointer',
            borderRadius: 4,
            transition: 'background 0.2s',
            userSelect: 'none',
          }}
          title="Click to edit notification"
          onClick={handleNotificationClick}
        >
          {notificationMessage}
        </div>
      </div>
    </div>

  )
}
