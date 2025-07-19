import { useState } from 'react';
import OrderBook from './OrderBook.jsx';
import TradesModal from './TradesHistory.jsx';

export default function TradesPanel() {
  const [activeTab, setActiveTab] = useState('OrderBook');

  return (
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
          <OrderBook />
        </div>
        <div className={activeTab === 'Trades' ? 'block' : 'hidden'}>
          <TradesModal />
        </div>
      </div>
    </div>
  );
}