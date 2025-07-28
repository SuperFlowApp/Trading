import { useState } from 'react';
import Positions from './PositionsOpen';
import Tab from '../CommonUIs/tab'; // Import the Tab component

function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('positions');

  const tabKeys = ['positions', 'orders', 'history'];

  const renderLabel = (key) => {
    switch (key) {
      case 'positions': return 'Positions';
      case 'orders': return 'Open Orders';
      case 'history': return 'Order History';
      default: return key;
    }
  };

  return (
    <div className=" flex flex-col w-full bg-backgroundmid rounded-md">
      {/* Tab Headers */}
      <Tab
        tabs={tabKeys}
        active={activeTab}
        onChange={setActiveTab}
        renderLabel={renderLabel}
        className="mb-[-2px]"
      />

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'positions' && 
        <section className="text-white p-4">
          <Positions />
        </section>}
        {activeTab === 'orders' && <div>Open orders will be listed here.</div>}
        {activeTab === 'history' && <div>Order history will be shown here.</div>}
      </div>
    </div>
  );
}

export default PositionsPanel;
