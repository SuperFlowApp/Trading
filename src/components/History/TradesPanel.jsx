import { useState } from 'react';
import OrderBook from './OrderBook';
import TradesModal from './TradesHistory';
import Tab from '../CommonUIs/tab';

export default function TradesPanel() {
  const [activeTab, setActiveTab] = useState('OrderBook');

  return (
    <div className="p-2 flex flex-col bg-backgroundmid rounded-md overflow-hidden w-[400px]">
      {/* Tab Selector */}
      <Tab
        tabs={['OrderBook', 'Trades']}
        active={activeTab}
        onChange={setActiveTab}
        renderLabel={tab => tab === 'OrderBook' ? 'Order Book' : 'Trades'}
        className=""
      />
      {/* Render Both Components */}
      <div className=" rounded-b-md py-2">
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