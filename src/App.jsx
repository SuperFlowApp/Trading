import noiseImage from '/assets/noise.jpg';

import { AuthProvider } from './components/AuthContext.jsx';
import { useState } from 'react';
import Navbar from './components/navbar.jsx';
import CandleChart from './components/CandleChart.jsx';
import OrderBook from './components/OrderBook.jsx';
import LimitOrderForm from './components/PlaceOrderForm.jsx';
import Infobar from './components/Infobar.jsx';
import TradesModal from './components/Trades.jsx';

import PositionsPanel from './components/Positions.jsx';

import Stream from './components/stream.jsx';

function App() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="bg-[#0D2221]">
        <Navbar />
      </div>
      <div
        className="fixed top-0 left-0 w-screen h-screen pointer-events-none opacity-5 z-10"
        style={{ backgroundImage: `url(${noiseImage})`, backgroundRepeat: 'repeat' }}
      />
      <div className="flex flex-col h-auto overflow-y-auto">

        <div className="relative w-screen h-auto overflow-visible">

          <main className="flex flex-1 p-2 gap-2">

            {/* CandleChart/Infobar */}
            <div className="flex flex-col h-full gap-2 bg-transparent basis-[75%] min-w-0 ">
              <div className="overflow-visible">
                <Infobar selectedPair={selectedPair} setSelectedPair={setSelectedPair} />
              </div>
              <div className="flex">
                <div className="flex-1 bg-[#0D2221] rounded-md p-3 min-w-0 overflow-hidden">
                  <CandleChart selectedPair={selectedPair} />
                  <PositionsPanel />
                </div>
                <div className="flex flex-col bg-[#0D2221] rounded-md p-3 min-w-0 overflow-hidden basis-[20%]">
                  <OrderBook selectedPair={selectedPair} />
                  <TradesModal />
                </div>
              </div>
            </div>
            {/* PositionsPanel*/}
            <div className="flex flex-col bg-[#0D2221] rounded-md p-3 min-w-0 overflow-hidden basis-[25%]">
              <LimitOrderForm selectedPair={selectedPair} />
            </div>
          </main>
          <section className="bg-[#0D2221] text-white p-4">
          </section>
          <footer className=""></footer>
        </div>
        {/* Pass selectedPair to Stream   
        <Stream />
      */}
      </div>
    </AuthProvider>
  );
}

export default App;
