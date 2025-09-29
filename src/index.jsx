import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import { AuthKeyProvider } from './contexts/AuthKeyContext';
import NotificationBar from './components/notificationBar'; 
import { useZustandStore } from './Zustandstore/useStore'; 
import LoadingScreen from './components/Loading';
import MobileBlocker from './components/MobileBlocker';
import { MultiWebSocketProvider } from "./contexts/MultiWebSocketContext";

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
  const [loading, setLoading] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Check if the device is mobile based on screen width
    const checkMobileDevice = () => {
      setIsMobileDevice(window.innerWidth < 768); // Common breakpoint for mobile
    };
    
    // Check on initial load
    checkMobileDevice();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobileDevice);
    
    // Show loading screen for at least 2 seconds (matches LoadingScreen)
    const timer = setTimeout(() => setLoading(false), 2000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // If mobile device is detected, show the mobile blocker
  if (isMobileDevice) {
    return <MobileBlocker />;
  }

  return (
    <StrictMode>
      <AuthKeyProvider>
        <MultiWebSocketProvider>
          <CssVarSync />
          <Navbar />
          <div className="w-full">
            <NotificationBar />
          </div>
          <div className="flex justify-center items-start">
            <FuturesApp />
          </div>
          {loading && <LoadingScreen />}
        </MultiWebSocketProvider>
      </AuthKeyProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);