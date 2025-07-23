import { AuthProvider } from './context/Authentication.jsx';
import KlineChartProPanel from './components/Chart/KlineChart.jsx';
import LimitOrderForm from './components/OrderForm/OrderPanel.jsx';
import Infobar from './components/infobar/Infobar.jsx';
import NotificationBar from './components/notificationBar.jsx';
import PositionsPanel from './components/UserInfoPanels/PositionsPanel.jsx';
import AccountInfoPanel from './components/UserInfoPanels/AccountInfoPanel.jsx';
import AuthPanel from './components/Login/LoginPanel.jsx';
import usePanelStore from './Zustandstore/panelStore.js';
import TradesPanel from './components/History/TradesPanel.jsx';

function FuturesApp() {
  const showLoginPanel = usePanelStore(s => s.showLoginPanel);
  const setShowLoginPanel = usePanelStore(s => s.setShowLoginPanel);

  return (
    <AuthProvider>
      <div className="relative w-screen h-auto overflow-visible">
        <div className="flex flex-1 p-1 gap-1">
          {/* TradingViewChart/Infobar */}
          <div className="flex gap-1 w-full ">
            <div className="flex flex-col flex-1 gap-1">
              <NotificationBar />
              <Infobar />
              <KlineChartProPanel />
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
