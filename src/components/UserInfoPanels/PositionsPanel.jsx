import { useState } from 'react';
import Positions from './PositionsOpen';
import Tab from '../CommonUIs/tab'; // Import the Tab component

function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('balances');

  const tabKeys = [
    'balances',
    'positions',
    'orders',
    'twap',
    'tradeHistory',
    'fundingHistory',
    'orderHistory'
  ];

  const renderLabel = (key) => {
    switch (key) {
      case 'balances': return 'Balances';
      case 'positions': return 'Positions';
      case 'orders': return 'Open Orders';
      case 'twap': return 'TWAP';
      case 'tradeHistory': return 'Trade History';
      case 'fundingHistory': return 'Funding History';
      case 'orderHistory': return 'Order History';
      default: return key;
    }
  };

  return (
    <div className=" flex flex-col w-full bg-backgroundmid rounded-md px-2">
      {/* Tab Headers */}
      <div className="border-b-[2px] border-primary2deactive">
        <div className=" flex flex-col max-w-[1000px] bg-backgroundmid rounded-md">
          <Tab
            tabs={tabKeys}
            active={activeTab}
            onChange={setActiveTab}
            renderLabel={renderLabel}
            className="mb-[-2px]"
          />
        </div>
      </div>
      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'balances' && <div>Balances will be shown here.</div>}
        {activeTab === 'positions' &&
          <section className="text-white p-4">
            <Positions />
          </section>}
        {activeTab === 'orders' && <div>Open orders will be listed here.</div>}
        {activeTab === 'twap' && <div>TWAP orders will be shown here.</div>}
        {activeTab === 'tradeHistory' && <div>Trade history will be shown here.</div>}
        {activeTab === 'fundingHistory' && <div>Funding history will be shown here.</div>}
        {activeTab === 'orderHistory' && <div>Order history will be shown here.</div>}
      </div>
    </div>
  );
}

export default PositionsPanel;
