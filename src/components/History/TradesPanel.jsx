import { useState } from 'react';
import OrderBook from './OrderBook';
import TradesModal from './TradesHistory';
import Tab from '../CommonUIs/tab';

export default function TradesPanel() {
  const [activeTab, setActiveTab] = useState('OrderBook');

  return (
    <div className="px-2 py-1 flex flex-col bg-backgroundmid rounded-md overflow-hidden
                    min-h-[510px] max-h-[710px]
                    min-w-[330px] 3xl:min-w-[560px]
                   ">
      {/* Tab Selector */}
      <Tab
        tabs={['OrderBook', 'Trades']}
        active={activeTab}
        onChange={setActiveTab}
        renderLabel={tab => tab === 'OrderBook' ? 'Order Book' : 'Trades'}
        className=""
      />
      {/* Render Both Components */}
      <div className=" rounded-b-md">
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