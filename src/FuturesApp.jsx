import { AuthProvider } from './context/Authentication.jsx';
import KlineChartProPanel from './components/Chart/KlineChart.jsx';
import LimitOrderForm from './components/OrderForm/PlaceOrderPanel.jsx';
import Infobar from './components/Infobar.jsx';
import PositionsPanel from './components/Positions/PositionsPanel.jsx';
import AccountInfoPanel from './components/Positions/AccountInfoPanel.jsx';
import AuthPanel from './components/Login/LoginPanel.jsx';
import usePanelStore from './store/panelStore.js';
import TradesPanel from './components/History/TradesPanel.jsx';

function FuturesApp() {
  const showLoginPanel = usePanelStore(s => s.showLoginPanel);
  const setShowLoginPanel = usePanelStore(s => s.setShowLoginPanel);

  return (
    <AuthProvider>
      <div className="relative w-screen h-auto overflow-visible">
        <div className="flex flex-1 p-2 gap-2">
          {/* TradingViewChart/Infobar */}
          <div className="flex flex-col gap-2 w-full ">
            <div className="flex">
              <div className="mr-2 flex-1">
                <Infobar />
                <KlineChartProPanel />
              </div>
              <TradesPanel />
            </div>
            <PositionsPanel />
          </div>
          <div className="flex flex-col w-[360px] gap-2">
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
