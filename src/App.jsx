import { AuthProvider } from './context/Authentication.jsx';
import { useState, useEffect } from 'react';
import Navbar from './components/navbar.jsx';
import CandleChart from './components/ChartPanel/CandleChart.jsx';
import OrderBook from './components/TradesPanel/OrderBook.jsx';
import LimitOrderForm from './components/PlaceOrderPanel.jsx';
import Infobar from './components/ChartPanel/Infobar.jsx';
import PositionsPanel from './components/PositionsPanel/PositionsPanel.jsx';
import TradesModal from './components/TradesPanel/AllTradesList.jsx';
import AccountInfoPanel from './components/PositionsPanel/AccountInfoPanel.jsx';



function App() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState('OrderBook'); // State for tab selection
  const [priceMidpoint, setPriceMidpoint] = useState(null); // State to store priceMidpoint
  const [selectedPrice, setSelectedPrice] = useState(null); // State to store selected price
  const [isMobile, setIsMobile] = useState(false); // State to detect mobile size
  const [selectedCurrency, setSelectedCurrency] = useState('BTC'); // Add this

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Detect mobile size (768px or less)
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize); // Add resize listener

    return () => {
      window.removeEventListener('resize', handleResize); // Cleanup listener
    };
  }, []);

  if (isMobile) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen bg-backgroundlight text-white"
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
        className="bg-backgroundlight"
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
              {/* CandleChart/Infobar */}
              <div className="flex flex-col h-full gap-2 bg-transparent basis-[75%] min-w-0 ">
                <div className="flex gap-2">
                  <div className="bg-backgroundlight rounded-md flex-1 min-w-0 overflow-hidden">
                    <div className="overflow-visible">
                      <Infobar
                        className=""
                        selectedPair={selectedPair}
                        setSelectedPair={setSelectedPair}
                      />
                    </div>
                    <div className="p-2">
                      <CandleChart selectedPair={selectedPair} />
                    </div>
                  </div>
                  <div className="flex flex-col bg-backgroundlight rounded-md min-w-0 overflow-hidden basis-[30%]">
                    {/* Tab Selector */}
                    <div className="flex relative">
                      <button
                        className={`flex-1 p-2 text-center ${activeTab === 'OrderBook'
                          ? 'bg-backgroundlight/10 text-white font-bold border-b-2 border-primary2'
                          : 'bg-backgroundlight text-gray-400 border-b-2 border-primary2/30 hover:border-primary2/50'
                          }`}
                        onClick={() => setActiveTab('OrderBook')}
                      >
                        Order Book
                      </button>
                      <button
                        className={`flex-1 p-2 text-center ${activeTab === 'Trades'
                          ? 'bg-bg-backgroundlight/10 text-white font-bold border-b-2 border-primary2'
                          : 'bg-bg-backgroundlight text-gray-400 border-b-2 border-primary2/30 hover:border-primary2/50'
                          }`}
                        onClick={() => setActiveTab('Trades')}
                      >
                        Trades
                      </button>
                    </div>
                    {/* Render Both Components */}
                    <div className="bg-backgroundlight rounded-b-md p-2">
                      <div className={activeTab === 'OrderBook' ? 'block' : 'hidden'}>
                        <OrderBook
                          selectedPair={selectedPair}
                          onPriceMidpointChange={setPriceMidpoint}
                          onRowSelect={setSelectedPrice}
                          selectedCurrency={selectedCurrency} // Pass currency to OrderBook
                        />
                      </div>
                      <div className={activeTab === 'Trades' ? 'block' : 'hidden'}>
                        <TradesModal />
                      </div>
                    </div>
                  </div>
                </div>
                <section className="text-white">
                  <div className="bg-backgroundlight rounded-md">
                    <PositionsPanel />
                  </div>
                </section>

              </div>
              {/* PositionsPanel */}
              <div className="flex flex-col basis-[25%] gap-2">
                <div className="flex flex-col bg-backgroundlight rounded-md min-w-0 overflow-hidden">
                  <LimitOrderForm
                    selectedPair={selectedPair}
                    priceMidpoint={priceMidpoint}
                    selectedPrice={selectedPrice}
                    onCurrencyChange={setSelectedCurrency} // Listen for currency changes
                  />
                </div>
                {/* Account Information */}
                <div className="flex flex-col bg-backgroundlight rounded-md  p-3 min-w-0 overflow-hidden">
                  <AccountInfoPanel
                  />
                </div>
              </div>
            </div>


            <footer className=""></footer>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
