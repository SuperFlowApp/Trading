import { AuthProvider } from './context/Authentication.jsx';
import KlineChartProPanel from './components/Chart/KlineChart.jsx';
import LimitOrderForm from './components/OrderForm/PlaceOrderPanel.jsx';
import Infobar from './components/Infobar.jsx';
import PositionsPanel from './components/Positions/PositionsPanel.jsx';
import AccountInfoPanel from './components/Positions/AccountInfoPanel.jsx';
import AuthPanel from './components/Login/LoginPanel.jsx';
import usePanelStore from './store/panelStore.js';
import TradesPanel from './components/History/TradesPanel.jsx';
import './index.css';

function MainApp() {
  const showLoginPanel = usePanelStore(s => s.showLoginPanel);
  const setShowLoginPanel = usePanelStore(s => s.setShowLoginPanel);

  return (
    <AuthProvider>

        <div className="fixed top-0 left-0 w-screen h-screen pointer-events-none opacity-5 z-10" />
        <div className="flex flex-col h-auto overflow-y-auto">
          <div className="relative w-screen h-auto overflow-visible">
            <div className="flex flex-1 p-2 gap-2">
              {/* TradingViewChart/Infobar */}
              <div className="flex flex-col h-full gap-2 bg-transparent w-full ">
                <div className="flex">
                  <div className="mr-2  flex-1 overflow-hidden">
                    <div className="bg-backgrounddark rounded-md overflow-visible mb-2">
                      <Infobar />
                    </div>
                    <div className="bg-backgrounddark rounded-md p-4 h-[300%]">
                      {/* KlineChart */}
                      <KlineChartProPanel />
                    </div>
                  </div>
                  <TradesPanel />
                </div>
                <section className="text-white">
                  <div className="bg-backgrounddark rounded-md">
                    <PositionsPanel />
                  </div>
                </section>
              </div>
              {/* PositionsPanel */}
              <div className="flex flex-col w-[360px] gap-2">
                <div className="flex flex-col bg-backgrounddark rounded-md min-w-0 overflow-hidden">
                  <LimitOrderForm />
                </div>
                {/* Account Information */}
                <div className="flex flex-col bg-backgrounddark rounded-md  p-2 min-w-0 overflow-hidden">
                  <AccountInfoPanel />
                </div>
              </div>
              {/* Show LoginPanel modal */}
              {showLoginPanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                  <AuthPanel onClose={() => setShowLoginPanel(false)} />
                </div>
              )}
            </div>
            <footer className=""></footer>
          </div>
        </div>

    </AuthProvider>
  );
}

export default MainApp;
