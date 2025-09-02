import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import { AuthKeyProvider } from './contexts/AuthKeyContext';
import NotificationBar from './components/notificationBar'; 
import { useZustandStore } from './Zustandstore/useStore'; 
import Logo from '../public/assets/Logo.svg'; 

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

function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-backgroundmid w-screen h-screen sm:hidden">
      <img src={Logo} alt="Logo" className="mb-6 w-32 h-auto" />
      <div className="text-white text-xl font-semibold text-center px-4">
        Sorry, not available on phone yet
      </div>
    </div>
  );
}

function RootApp() {
  return (
    <StrictMode>
      <AuthKeyProvider>
        <CssVarSync />
        <div className="block sm:hidden">
          <MobileBlocker />
        </div>
        {/* Main app hidden on mobile */}
        <div className="hidden sm:block">
          <Navbar />
          <div className="w-full">
            <NotificationBar />
          </div>
          <div className="flex justify-center items-start">
            <FuturesApp />
          </div>
        </div>
      </AuthKeyProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);