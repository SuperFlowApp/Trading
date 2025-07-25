import { useState } from 'react';
import useZustandStore from './Zustandstore/panelStore.js';
import notificationStore from './Zustandstore/notificationStore.js';
import useUserInputStore from './Zustandstore/userInputStore.js';

export default function AdminPanel() {
  const storeState = useZustandStore();
  const notificationStoreState = notificationStore();
  const setNotification = notificationStore((s) => s.setNotification);
  const useUserInputStoreState = useUserInputStore();

  const [modalOpen, setModalOpen] = useState(false);

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
    <div style={{ background: '#18181b', color: '#fff', minHeight: '100vh', padding: 32 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Admin Panel</h1>

      {/* Notification Panel */}
      <div
        style={{
          background: '#23272f',
          padding: 14,
          borderRadius: 8,
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

      <h2 style={{ fontSize: 20, marginBottom: 8 }}>userInputStore.js</h2>
      <pre
        style={{
          background: '#23272f',
          color: '#d1d5db',
          padding: 16,
          borderRadius: 8,
          fontSize: 14,
          overflowX: 'auto',
          maxHeight: 400,
        }}
      >
        {JSON.stringify({ ...useUserInputStoreState }, null, 2)}
      </pre>

      <h2 style={{ fontSize: 20, marginBottom: 8 }}>panelStore.js</h2>
      <pre
        style={{
          background: '#23272f',
          color: '#d1d5db',
          padding: 16,
          borderRadius: 8,
          fontSize: 14,
          overflowX: 'auto',
          maxHeight: 400,
        }}
      >
        {JSON.stringify({ ...storeState, allMarketData: '[See Modal]' }, null, 2)}
      </pre>
      <button
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        onClick={() => setModalOpen(true)}
      >
        Show allMarketData
      </button>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#23272f',
              color: '#d1d5db',
              padding: 24,
              borderRadius: 8,
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
            <h3 style={{ marginBottom: 12 }}>allMarketData</h3>
            <pre style={{ fontSize: 12, maxHeight: 500, overflow: 'auto' }}>
              {JSON.stringify(storeState.allMarketData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}