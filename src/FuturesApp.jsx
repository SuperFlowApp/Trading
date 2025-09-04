import { useState } from 'react';
import ChartPanel from './components/Chart/ChartPanel';
import LimitOrderForm from './components/OrderForm/OrderPanel';
import Infobar from './components/infobar/Infobar';
import PositionsPanel from './components/UserInfoPanels/PositionsPanel';
import AccountInfoPanel from './components/OrderForm/AccountInfoPanel';
import TradesPanel from './components/History/TradesPanel';
import OrderBook from './components/History/OrderBook';
import Navbar from './components/navbar';
import Tab from './components/CommonUIs/tab'; // Import your custom Tab

function FuturesApp() {
  const [mobileTab, setMobileTab] = useState('markets');

  // Tab keys and labels for the bottom tab bar
  const tabKeys = ['markets', 'trade', 'account'];
  const tabIcons = {
    markets: <span className="material-icons text-xl mb-1"></span>,
    trade: <span className="material-icons text-xl mb-1"></span>,
    account: <span className="material-icons text-xl mb-1"></span>,
  };
  const tabLabels = {
    markets: 'Markets',
    trade: 'Trade',
    account: 'Account',
  };

  return (
    <div className="relative min-w-0 w-full h-auto overflow-visible">
      {/* Desktop/Tablet layout */}
      <div className="hidden sm:flex min-w-0 flex-1 p-1 gap-1">
        <div className="flex min-w-0 flex-col gap-1 w-full ">
          <div className="flex min-w-0 gap-1 w-full ">
            <div className="flex min-w-0 flex-col flex-1 gap-1">
              <Infobar />
              <ChartPanel />
            </div>
            <TradesPanel />
          </div>
          <PositionsPanel />
        </div>
        <div className="flex flex-col min-w-[330px] 3xl:min-w-[560px] gap-1">
          <LimitOrderForm />
          <AccountInfoPanel />
        </div>
      </div>
      {/* Mobile layout */}
      <div className="block sm:hidden min-h-screen">
        {/* Fixed Infobar under navbar */}
        <div className="fixed top-[56px] left-0 w-full z-40 bg-backgroundmid">
          <Infobar />
        </div>
        {/* Scrollable content with padding for fixed top/bottom bars */}
        <div className="pt-4 h-full flex flex-col ">
          {mobileTab === 'markets' && (
            <>
              <ChartPanel />
              <PositionsPanel />
            </>
          )}
          {mobileTab === 'trade' && (
            <>
              <LimitOrderForm />
              <OrderBook />
            </>
          )}
          {mobileTab === 'account' && (
            <AccountInfoPanel />
          )}
        </div>
        {/* Bottom tab bar - fixed always at the very bottom */}
        <div className="fixed bottom-0 left-0 w-full bg-backgroundmid border-t border-liquiddarkgray z-50">
          <Tab
            tabs={tabKeys}
            active={mobileTab}
            onChange={setMobileTab}
            className="h-14"
            renderLabel={tab =>
              <div className="flex flex-col items-center justify-center">
                {tabIcons[tab]}
                <span className="text-xs">{tabLabels[tab]}</span>
              </div>
            }
          />
        </div>
      </div>
      {/* Fixed Navbar at the top */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>
    </div>
  );
}

export default FuturesApp;
