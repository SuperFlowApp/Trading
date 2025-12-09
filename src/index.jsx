import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import NotificationBar from './components/notificationBar'; 
import { useZustandStore } from './Zustandstore/useStore'; 
import LoadingScreen from './components/Loading';
import MobileBlocker from './components/MobileBlocker';
import { MultiWebSocketProvider } from "./contexts/MultiWebSocketContext";
import TermsModal from './components/TermsModal';
import Cookies from 'js-cookie';

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
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const checkMobileDevice = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);

    const timer = setTimeout(() => {
      setLoading(false);
      // Only show terms modal if not accepted
      if (Cookies.get('termsAccepted') !== 'true') {
        setShowTerms(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // If mobile device is detected, show the mobile blocker
  if (isMobileDevice) {
    return <MobileBlocker />;
  }

  // Blur the app when terms modal is open
  return (
    <StrictMode>
        <MultiWebSocketProvider>
          <CssVarSync />
          <Navbar />
          <div className="w-full">
            <NotificationBar />
          </div>
          <div className={`flex justify-center items-start ${showTerms ? 'blur-sm pointer-events-none select-none' : ''}`}>
            <FuturesApp />
          </div>
          {loading && <LoadingScreen />}
          {showTerms && (
            <TermsModal
              onAccept={() => setShowTerms(false)}
              onDecline={() => setShowTerms(false)}
            />
          )}
        </MultiWebSocketProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);