import { AuthProvider } from './context/Authentication.jsx';
import { useState } from 'react';
import Navbar from './components/navbar.jsx';
import CandleChart from './components/ChartPanel/CandleChart.jsx';
import OrderBook from './components/TradesPanel/OrderBook.jsx';
import LimitOrderForm from './components/PlaceOrderPanel.jsx';
import Infobar from './components/ChartPanel/Infobar.jsx';


import PositionsPanel from './components/PositionsPanel/PositionsPanel.jsx';
import TradesModal from './components/TradesPanel/AllTradesList.jsx';

function App() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState('OrderBook'); // State for tab selection
  const [priceMidpoint, setPriceMidpoint] = useState(null); // State to store priceMidpoint
  const [selectedPrice, setSelectedPrice] = useState(null); // State to store selected price

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
                      <Infobar className=""
                        selectedPair={selectedPair} setSelectedPair={setSelectedPair} />
                    </div>
                    <div className=" p-3 ">
                      <CandleChart selectedPair={selectedPair} />
                    </div>
                  </div>

                  <div className=" flex flex-col bg-backgroundlight rounded-md min-w-0 overflow-hidden basis-[30%]">
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
                        />
                      </div>
                      <div className={activeTab === 'Trades' ? 'block' : 'hidden'}>
                        <TradesModal />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PositionsPanel*/}
              <div className="flex flex-col bg-backgroundlight rounded-md min-w-0 overflow-hidden basis-[25%]">
                <LimitOrderForm
                  selectedPair={selectedPair}
                  priceMidpoint={priceMidpoint}
                  selectedPrice={selectedPrice} // Pass selected price as a prop
                />
              </div>
            </div>
            <section className=" text-white p-2">
              <div className=" bg-backgroundlight rounded-md">
                <PositionsPanel />
              </div>
            </section>
            <footer className=""></footer>
          </div>

        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
