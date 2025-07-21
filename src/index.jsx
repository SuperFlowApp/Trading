import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp.jsx';
import Navbar from './components/navbar.jsx';
import CommingSoon from './components/CommonUIs/CommingSoon.jsx';
import { AuthProvider } from './context/Authentication.jsx'; // <-- import AuthProvider
import './components/index.css';
import 'antd/dist/reset.css'; // Ant Design 
import './components/ant-overrides.css';

const container = document.getElementById('root');
const root = createRoot(container);

function TradingPanel(isMobile) {

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
      <AuthProvider>

        <Navbar />
        {TradingPanel(isMobile)}
      </AuthProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);