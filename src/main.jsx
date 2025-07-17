import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/Authentication.jsx';
import Navbar from './components/navbar.jsx';
import CandleChart from './components/ChartPanel/CandleChart.jsx';
import KlineChartProPanel  from './components/ChartPanel/KlineChart.jsx'; // Import KlineChart
import OrderBook from './components/TradesPanel/OrderBook.jsx';
import LimitOrderForm from './components/PlaceOrderPanel.jsx';
import Infobar from './components/ChartPanel/Infobar.jsx';
import PositionsPanel from './components/PositionsPanel/PositionsPanel.jsx';
import TradesModal from './components/TradesPanel/AllTradesList.jsx';
import AccountInfoPanel from './components/PositionsPanel/AccountInfoPanel.jsx';
import AuthPanel from './components/LoginPanel.jsx'; // Import AuthPanel
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- Add this import
import './index.css';

// Create wagmi config (customize for your chains/providers)
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// Create a QueryClient instance
const queryClient = new QueryClient();

function MainApp() {
  const [activeTab, setActiveTab] = useState('OrderBook');
  const [priceMidpoint, setPriceMidpoint] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [showLoginPanel, setShowLoginPanel] = useState(false);

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
                      <KlineChartProPanel  /> {/* Add KlineChart here */}
                    </div>
                  </div>
                  <div className="flex flex-col bg-backgrounddark rounded-md overflow-hidden w-[400px]">
                    {/* Tab Selector */}
                    <div className="flex relative">
                      <button
                        className={`flex-1 p-2 text-center ${activeTab === 'OrderBook'
                          ? 'bg-backgrounddark text-white font-bold border-b-2 border-primary2'
                          : 'bg-backgrounddark text-gray-400 border-b-2 border-primary2/30 hover:border-primary2/50'
                          }`}
                        onClick={() => setActiveTab('OrderBook')}
                      >
                        Order Book
                      </button>
                      <button
                        className={`flex-1 p-2 text-center ${activeTab === 'Trades'
                          ? 'bg-bg-backgrounddark text-white font-bold border-b-2 border-primary2'
                          : 'bg-bg-backgrounddark text-gray-400 border-b-2 border-primary2/30 hover:border-primary2/50'
                          }`}
                        onClick={() => setActiveTab('Trades')}
                      >
                        Trades
                      </button>
                    </div>
                    {/* Render Both Components */}
                    <div className="bg-backgrounddark rounded-b-md p-2">
                      <div className={activeTab === 'OrderBook' ? 'block' : 'hidden'}>
                        <OrderBook
                          onPriceMidpointChange={setPriceMidpoint}
                          onRowSelect={setSelectedPrice}
                          selectedCurrency={selectedCurrency}
                        />
                      </div>
                      <div className={activeTab === 'Trades' ? 'block' : 'hidden'}>
                        <TradesModal />
                      </div>
                    </div>
                  </div>
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
                  <LimitOrderForm
                    priceMidpoint={priceMidpoint}
                    selectedPrice={selectedPrice}
                    onCurrencyChange={setSelectedCurrency}
                    onConnect={() => setShowLoginPanel(true)} // Pass handler
                  />
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}> {/* <-- Wrap with QueryClientProvider */}
        <WagmiProvider config={config}>
          <Routes>
            <Route path="/" element={<Navigate to="/BTC" replace />} />
            <Route path="/:base" element={<MainApp />} />
            {/* ...other routes */}
          </Routes>
        </WagmiProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
