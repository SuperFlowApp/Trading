import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import { AuthKeyProvider } from './contexts/AuthKeyContext';
import NotificationBar from './components/notificationBar'; 
import { useZustandStore } from './Zustandstore/useStore'; 

import './components/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

//  sync Zustand colors to CSS variables
function CssVarSync() {
  const red = useZustandStore((s) => s.red);
  const green = useZustandStore((s) => s.green);
  const fontSize = useZustandStore((s) => s.chartSettings.fontSize);

  useEffect(() => {
    if (red) document.documentElement.style.setProperty('--color-red', red);
    if (green) document.documentElement.style.setProperty('--color-green', green);
    // Font size mapping
    if (fontSize === 'small') {
      document.documentElement.style.setProperty('--text-body-size', '12px');
      document.documentElement.style.setProperty('--text-title-size', '15px');
    } else if (fontSize === 'large') {
      document.documentElement.style.setProperty('--text-body-size', '14px');
      document.documentElement.style.setProperty('--text-title-size', '18px');
    } else {
      document.documentElement.style.setProperty('--text-body-size', '13px');
      document.documentElement.style.setProperty('--text-title-size', '16px');
    }
  }, [red, green, fontSize]);

  return null;
}

function RootApp() {
  return (
    <StrictMode>
      <AuthKeyProvider>
        <CssVarSync />
        <Navbar />
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