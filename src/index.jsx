import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import { AuthKeyProvider } from './contexts/AuthKeyContext'; // <-- use provider
import NotificationBar from './components/notificationBar'; // <-- import here
import { useZustandStore } from './Zustandstore/useStore'; // <-- import your store

import './components/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

// Add a component to sync Zustand colors to CSS variables
function CssVarSync() {
  const red = useZustandStore((s) => s.red);
  const green = useZustandStore((s) => s.green);

  useEffect(() => {
    if (red) document.documentElement.style.setProperty('--color-red', red);
    if (green) document.documentElement.style.setProperty('--color-green', green);
  }, [red, green]);

  return null;
}

function RootApp() {
  return (
    <StrictMode>
      <AuthKeyProvider>
        <CssVarSync />
        <Navbar />
        {/* NotificationBar right under Navbar, full width */}
        <div className="w-full">
          <NotificationBar />
        </div>
        <div className="flex justify-center items-start">
          <FuturesApp />
        </div>
      </AuthKeyProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);