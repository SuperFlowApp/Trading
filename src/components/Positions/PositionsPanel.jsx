import { useState } from 'react';
import Positions from './PositionsOpen.jsx';

function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('positions');

  const tabClass = (name) =>
    `border-b-2  mb-[-2px] px-4 py-2 rounded-t-md transition-all ${activeTab === name ? 'border-primary2/100' : 'text-secondary1 border-primary2/0 hover:border-primary2/30'
    }`;

  return (
    <div className="flex flex-col w-full">
      {/* Tab Headers */}
      <div className="flex border-b-2 border-primary2/50">
        <button onClick={() => setActiveTab('positions')}
         className={`${tabClass('positions')} w-[160px]`}>
          Positions
        </button>
        <button onClick={() => setActiveTab('orders')}
         className={`${tabClass('orders')} w-[160px]`} >
          Open Orders
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`${tabClass('history')} w-[160px]`}>
          Order History
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
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
