import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/Authentication.jsx';
import Navbar from './components/navbar.jsx';
import KlineChartProPanel from './components/ChartPanel/KlineChart.jsx'; // Import KlineChart
import LimitOrderForm from './components/LimitOrderForm/PlaceOrderPanel.jsx';
import Infobar from './components/Infobar.jsx';
import PositionsPanel from './components/PositionsPanel/PositionsPanel.jsx';
import AccountInfoPanel from './components/PositionsPanel/AccountInfoPanel.jsx';
import AuthPanel from './components/LoginPanel.jsx'; // Import AuthPanel
import usePanelStore from './store/panelStore.js'; // Zustand Storage
import TradesPanel from './components/TradesPanel/TradesPanel.jsx';
import './index.css';


function MainApp() {
  const [activeTab, setActiveTab] = useState('OrderBook');
  const [isMobile, setIsMobile] = useState(false);

  // Zustand storage 
  const showLoginPanel = usePanelStore(s => s.showLoginPanel);
  const setShowLoginPanel = usePanelStore(s => s.setShowLoginPanel);




  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <AuthProvider>
      <div
        style={{
          backgroundImage: `url('/assets/background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Navbar />
        <div className="fixed top-0 left-0 w-screen h-screen pointer-events-none opacity-5 z-10" />
        <div className="flex flex-col h-auto overflow-y-auto">
          <div className="relative w-screen h-auto overflow-visible">
            <div className="flex flex-1 p-2 gap-2">
              {/* TradingViewChart/Infobar */}
              <div className="flex flex-col h-full gap-2 bg-transparent w-full ">
                <div className="flex">
                  <div className="mr-2  flex-1 overflow-hidden">
                    <div className="bg-backgrounddark rounded-md overflow-visible mb-2">
                      <Infobar />
                    </div>
                    <div className="bg-backgrounddark rounded-md p-4 h-[300%]">
                      {/* KlineChart */}
                      <KlineChartProPanel />
                    </div>
                  </div>
                  <TradesPanel />
                </div>
                <section className="text-white">
                  <div className="bg-backgrounddark rounded-md">
                    <PositionsPanel />
                  </div>
                </section>
              </div>
              {/* PositionsPanel */}
              <div className="flex flex-col w-[360px] gap-2">
                <div className="flex flex-col bg-backgrounddark rounded-md min-w-0 overflow-hidden">
                  <LimitOrderForm />
                </div>
                {/* Account Information */}
                <div className="flex flex-col bg-backgrounddark rounded-md  p-2 min-w-0 overflow-hidden">
                  <AccountInfoPanel />
                </div>
              </div>
              {/* Show LoginPanel modal */}
              {showLoginPanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                  <AuthPanel onClose={() => setShowLoginPanel(false)} />
                </div>
              )}
            </div>
            <footer className=""></footer>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

const container = document.getElementById('root');

// Use a global variable to persist the root across HMR reloads
if (!window._root) {
  window._root = createRoot(container);
}

window._root.render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
