import ChartPanel from './components/Chart/ChartPanel';
import LimitOrderForm from './components/OrderForm/OrderPanel';
import Infobar from './components/infobar/Infobar';
import NotificationBar from './components/notificationBar';
import PositionsPanel from './components/UserInfoPanels/PositionsPanel';
import AccountInfoPanel from './components/UserInfoPanels/AccountInfoPanel';
import TradesPanel from './components/History/TradesPanel';

function FuturesApp() {
  return (
    <div className="relative min-w-0 w-[100%] h-auto overflow-visible">
      <div className="flex min-w-0 flex-1 p-1 gap-1">
        {/* TradingViewChart/Infobar */}
        <div className="flex min-w-0 flex-col gap-1 w-full ">
          <div className="flex min-w-0 gap-1 w-full ">
            <div className="flex min-w-0 flex-col flex-1 gap-1">
              <NotificationBar />
              <Infobar />
              <ChartPanel />
            </div>
            <TradesPanel />
          </div>
          <PositionsPanel />
        </div>
        <div className="flex min-w-0 flex-col w-[360px] gap-1">
          <LimitOrderForm />
          <AccountInfoPanel />
        </div>
      </div>
    </div>
  );
}

export default FuturesApp;
