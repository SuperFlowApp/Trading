import { useState } from 'react';
import Positions from './PositionsList.jsx';

function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('positions');

  const tabClass = (name) =>
    `px-4 py-2 rounded-t-md transition-all ${activeTab === name ? 'bg-[#1b3c3f]' : 'bg-[#0D2221] opacity-60 hover:opacity-100'
    }`;

  return (
    <div className="flex flex-col w-full">
      {/* Tab Headers */}
      <div className="flex space-x-2 border-b border-[#2D9DA8] pb-1">
        <button onClick={() => setActiveTab('positions')} className={tabClass('positions')}>
          Positions
        </button>
        <button onClick={() => setActiveTab('orders')} className={tabClass('orders')}>
          Open Orders
        </button>
        <button onClick={() => setActiveTab('history')} className={tabClass('history')}>
          Order History
        </button>
      </div>

      {/* Tab Content */}
      <div className="">
        {activeTab === 'positions' && 
        <section className=" text-white p-4">
          <Positions />
        </section>}
        {activeTab === 'orders' && <div>Open orders will be listed here.</div>}
        {activeTab === 'history' && <div>Order history will be shown here.</div>}
      </div>
    </div>
  );
}

export default PositionsPanel;
