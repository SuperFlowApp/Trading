import { useState } from 'react';
import OrderBook from './OrderBook.jsx';
import TradesModal from './TradesHistory.jsx';
import Tab from '../CommonUIs/tab.jsx';

export default function TradesPanel() {
  const [activeTab, setActiveTab] = useState('OrderBook');

  return (
    <div className="flex flex-col bg-backgrounddark rounded-md overflow-hidden w-[400px]">
      {/* Tab Selector */}
      <Tab
        tabs={['OrderBook', 'Trades']}
        active={activeTab}
        onChange={setActiveTab}
        renderLabel={tab => tab === 'OrderBook' ? 'Order Book' : 'Trades'}
        className="px-2"
      />
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