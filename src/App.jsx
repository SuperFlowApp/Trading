import noiseImage from '/assets/noise.jpg';

import { AuthProvider } from './components/AuthContext.jsx';
import { useState } from 'react';
import Navbar from './components/navbar.jsx';
import CandleChart from './components/CandleChart.jsx';
import OrderBook from './components/OrderBook.jsx';
import LimitOrderForm from './components/PlaceOrderForm.jsx';
import Infobar from './components/Infobar.jsx';

import PositionsPanel from './components/Positions.jsx';
import TradesModal from './components/Trades.jsx';

function App() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('OrderBook'); // State for tab selection

  return (
    <AuthProvider>
      <div className="bg-[#0D2221]">
        <Navbar />
      </div>
      <div
        className="fixed top-0 left-0 w-screen h-screen pointer-events-none opacity-5 z-10 "
        style={{ backgroundImage: `url(${noiseImage})`, backgroundRepeat: 'repeat' }}
      />
      <div className="flex flex-col h-auto overflow-y-auto">

        <div className="relative w-screen h-auto overflow-visible">

          <div className="flex flex-1 p-2 gap-2">

            {/* CandleChart/Infobar */}
            <div className="flex flex-col h-full gap-2 bg-transparent basis-[75%] min-w-0 ">

              <div className="flex gap-2">

                <div className="bg-[#002122] rounded-md flex-1 min-w-0 overflow-hidden">
                  <div className="overflow-visible">
                    <Infobar selectedPair={selectedPair} setSelectedPair={setSelectedPair} />
                  </div>
                  <div className=" p-3 ">
                    <CandleChart selectedPair={selectedPair} />
                  </div>
                </div>

                <div className=" flex flex-col bg-[#001F1F] rounded-md min-w-0 overflow-hidden basis-[30%]">
                  {/* Tab Selector */}
                  <div className="flex relative">
                    <button
                      className={`flex-1 p-2 text-center ${activeTab === 'OrderBook'
                        ? 'bg-[#00B7C9]/10 text-white font-bold border-b-2 border-[#00B7C9]'
                        : 'bg-[#001F1F] text-gray-400 border-b-2 border-[#00B7C9]/30'
                        }`}
                      onClick={() => setActiveTab('OrderBook')}
                    >
                      Order Book
                    </button>
                    <button
                      className={`flex-1 p-2 text-center ${activeTab === 'Trades'
                        ? 'bg-[#00B7C9]/10 0 text-white font-bold border-b-2 border-[#00B7C9]'
                        : 'bg-[#001F1F] text-gray-400 border-b-2 border-[#00B7C9]/30'
                        }`}
                      onClick={() => setActiveTab('Trades')}
                    >
                      Trades
                    </button>
                  </div>
                  <div className="bg-[#002122] rounded-b-md p-2">
                    {activeTab === 'OrderBook' && <OrderBook selectedPair={selectedPair} />}
                    {activeTab === 'Trades' && <TradesModal />}
                  </div>
                </div>
              </div>

            </div>

            {/* PositionsPanel*/}
            <div className="flex flex-col bg-[#002122] rounded-md min-w-0 overflow-hidden basis-[25%]">
              <LimitOrderForm selectedPair={selectedPair} />
            </div>
          </div>
          <section className="bg-[#002122] text-white p-4">
            <div className="mt-2 bg-[#002122] rounded-md p-3 ">
              <PositionsPanel />
            </div>
          </section>
          <footer className=""></footer>
        </div>

      </div>
    </AuthProvider>
  );
}

export default App;
