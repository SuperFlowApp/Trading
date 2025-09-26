import { useState } from 'react';
import Positions from './Positions/PositionsTab';
import OpenOrdersTab from './OpenOrders/OpenOrdersTab'; // <-- Import the OpenOrdersTab
import Tab from '../CommonUIs/tab'; // Import the Tab component
import TradesHistory from './TradesHistory/TradesHistory';

function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('positions');

  const tabKeys = [
    // 'balances', // Removed Balances
    'positions',
    'orders',
    // 'twap', // Removed TWAP
    'tradeHistory',
    'fundingHistory',
    'orderHistory'
  ];

  const renderLabel = (key) => {
    switch (key) {
      // case 'balances': return 'Balances'; // Removed Balances
      case 'positions': return 'Positions';
      case 'orders': return 'Open Orders';
      // case 'twap': return 'TWAP'; // Removed TWAP
      case 'tradeHistory': return 'Trade History';
      case 'fundingHistory': return 'Funding History';
      case 'orderHistory': return 'Order History';
      default: return key;
    }
  };

  return (
    <div className=" flex flex-col w-full  bg-backgroundmid rounded-md p-1 sm:overflow-visible overflow-y-auto  border-[1px] border-backgroundlighthover">
      {/* Tab Headers */}

      <div className="border-b-[1px] min-w-[800px] border-primary2darker  sm:overflow-visible overflow-y-auto">
        <div className=" flex flex-col max-w-[1200px] bg-backgroundmid rounded-md">
          <Tab
            tabs={tabKeys}
            active={activeTab}
            onChange={setActiveTab}
            renderLabel={renderLabel}
            className="mb-[-1px]"
          />
        </div>
      </div>
      {/* Tab Content */}
      <div className="text-center text-body text-liquidmidgray">
        {/* Positions */}
        <div style={{ display: activeTab === 'positions' ? 'block' : 'none' }}>
          <section className="text-white">
            <Positions />
          </section>
        </div>
        {/* Open Orders */}
        <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
          <OpenOrdersTab />
        </div>
        {/* Trade History */}
        <div style={{ display: activeTab === 'tradeHistory' ? 'block' : 'none' }}>
          <TradesHistory />
        </div>
        {/* Funding History */}
        <div style={{ display: activeTab === 'fundingHistory' ? 'block' : 'none' }}>
          <div className='py-8'>Funding history will be shown here.</div>
        </div>
        {/* Order History */}
        <div style={{ display: activeTab === 'orderHistory' ? 'block' : 'none' }}>
          <div className='py-8'>Order history will be shown here.</div>
        </div>
      </div>
    </div>
  );
}

export default PositionsPanel;
