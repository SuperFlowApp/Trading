import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import CommingSoon from './components/CommonUIs/CommingSoon';
import DebeggerPanel from './debugger';
import AdminPanel from './admin';

import './components/index.css';
import 'antd/dist/reset.css';
import './components/ant-overrides.css';

const container = document.getElementById('root');
const root = createRoot(container);

function TradingPanel(isMobile) {
  if (window.location.pathname.includes('options-trading')) {
    return <CommingSoon />;
  }
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

  // Routing logic for debug panel
  if (window.location.pathname.startsWith('/debugger')) {
    return (
      <DebeggerPanel />
    );
  }
  // Routing logic for admin panel
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <AdminPanel />
    );
  }


  
  return (
    <StrictMode>
        <Navbar />
        {TradingPanel(isMobile)}
    </StrictMode>
  );
}

root.render(<RootApp />);