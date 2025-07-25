import { AuthProvider } from './context/Authentication';
import ChartPanel from './components/Chart/ChartPanel';
import LimitOrderForm from './components/OrderForm/OrderPanel';
import Infobar from './components/infobar/Infobar';
import NotificationBar from './components/notificationBar';
import PositionsPanel from './components/UserInfoPanels/PositionsPanel';
import AccountInfoPanel from './components/UserInfoPanels/AccountInfoPanel';
import AuthPanel from './components/Login/LoginPanel';
import { useZustandStore } from './Zustandstore/panelStore';
import TradesPanel from './components/History/TradesPanel';

function FuturesApp() {
  const showLoginPanel = useZustandStore(s => s.showLoginPanel);
  const setShowLoginPanel = useZustandStore(s => s.setShowLoginPanel);

  return (
    <AuthProvider>
      <div className="relative w-screen h-auto overflow-visible">
        <div className="flex flex-1 p-1 gap-1">
          {/* TradingViewChart/Infobar */}
          <div className="flex gap-1 w-full ">
            <div className="flex flex-col flex-1 gap-1">
              <NotificationBar />
              <Infobar />
              <ChartPanel />
              <PositionsPanel />
            </div>
            <TradesPanel />
          </div>
          <div className="flex flex-col w-[360px] gap-1">
            <LimitOrderForm />
            <AccountInfoPanel />
          </div>
          {showLoginPanel && (
            <AuthPanel onClose={() => setShowLoginPanel(false)} />
          )}
        </div>
      </div>
    </AuthProvider>
  );
}

export default FuturesApp;
