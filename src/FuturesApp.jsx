import ChartPanel from './components/Chart/ChartPanel';
import LimitOrderForm from './components/OrderForm/OrderPanel';
import Infobar from './components/infobar/Infobar';
import NotificationBar from './components/notificationBar';
import PositionsPanel from './components/UserInfoPanels/PositionsPanel';
import AccountInfoPanel from './components/UserInfoPanels/AccountInfoPanel';
import TradesPanel from './components/History/TradesPanel';

function FuturesApp() {

  return (
    <div className="relative w-screen h-auto overflow-visible">
      <div className="flex flex-1 p-1 gap-1">
        {/* TradingViewChart/Infobar */}
        <div className="flex flex-col gap-1 w-full ">
          <div className="flex gap-1 w-full ">
            <div className="flex flex-col flex-1 gap-1">
              <NotificationBar />
              <Infobar />
              <ChartPanel />
            </div>
            <TradesPanel />
          </div>
          <PositionsPanel />
        </div>
        <div className="flex flex-col w-[360px] gap-1">
          <LimitOrderForm />
          <AccountInfoPanel />
        </div>
      </div>
    </div>
  );
}

export default FuturesApp;
