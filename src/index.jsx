import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp.jsx';
import Navbar from './components/navbar.jsx';
import CommingSoon from './components/CommonUIs/CommingSoon.jsx';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

function TradingPanel(isMobile) {
  if (isMobile) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen bg-backgrounddark text-white"
        style={{
          backgroundImage: `url('/assets/background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h1 className="text-2xl font-bold">Unavailable for mobile at the moment</h1>
      </div>
    );
  }
  if (window.location.pathname.includes('options-trading')) {
    return <CommingSoon />;
  }
  // Default to futures trading
  return <FuturesApp />;
}

function RootApp() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <StrictMode>
        <div
          style={{
            backgroundImage: `url('/assets/desktopBG.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            width: '100vw',
          }}
        >
          <Navbar />
          {TradingPanel(isMobile)}
        </div>
    </StrictMode>
  );
}

root.render(<RootApp />);