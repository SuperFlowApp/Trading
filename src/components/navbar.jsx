import { useState, useEffect, useRef } from "react";
import 'antd/dist/reset.css';
import LoginPanel from "./Login/LoginPanel";
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import context
import Button from "./CommonUIs/Button";
//import DebuggerPanel from "../debugger";
//import Draggable from "react-draggable"; // <-- add this import

const initialSettings = {
  skipOpenOrderConfirmation: false,
  skipClosePositionConfirmation: false,
  optOutSpotDusting: false,
  persistTradingConnection: true,
  customizeLayout: true,
  displayVerboseErrors: false,
  disableBackgroundFillNotifications: false,
  disablePlayingSoundForFills: false,
  animateOrderBook: true,
  orderBookSetSizeOnClick: false,
  showBuysAndSellsOnChart: false,
  hidePNL: false,
  showAllWarnings: false,
};

function Navbar() {
  const { authKey, setAuthKey } = useAuthKey(); // <-- use context
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes("options-trading")) return "options";
    return "futures";
  });
  //const [showDebugger, setShowDebugger] = useState(false);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  // Listen for clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  // Callback for AuthPanel to close modal on login and update accessToken
  const handleLoginSuccess = () => {
    setShowLogin(false);
    setDropdownOpen(false); // <-- close dropdown after login
    // setAuthKey is already called in login, nothing else needed
  };

  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "futures") {
      window.location.href = "/futures-trading";
    } else {
      window.location.href = "/options-trading";
    }
  };

  const handleDisconnect = () => {
    setAuthKey(null); // <-- clear token in context
  };

  return (
    <>
      <nav className="pl-[20px] pr-[30px] w-full flex items-center justify-between px-4 py-2 bg-backgroundmid text-white ">
        {/* Left Side */}
        <div className="flex items-center gap-14">
          <div className="flex items-end gap-2">
            <img src="/assets/Logo.svg" alt="Logo" className="h-8 w-auto" />
            <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto" />
            {/* Debugger small text link 
            <span
              className="ml-2 text-xs text-primary2 cursor-pointer hover:underline"
              onClick={() => setShowDebugger(true)}
              style={{ userSelect: "none" }}
            >
              Debugger
            </span>
            */}
          </div>
          <div className="flex items-center gap-14">

            <li
              className={`group flex items-center gap-2 cursor-pointer ${activeTab === "futures" ? "text-white" : "text-liquidwhite"
                }`}
              onClick={() => handleTabClick("futures")}
            >
              <img
                src="/assets/chart-candlestick.svg"
                alt="Futures"
                className={` ${activeTab === "futures"
                  ? "brightness-200"
                  : "brightness-100 group-hover:brightness-200"
                  }`}
              />
              Futures Trading
            </li>
            <li
              className={`group flex items-center gap-2 cursor-pointer ${activeTab === "options" ? "text-white" : "text-liquidwhite"
                }`}
              onClick={() => handleTabClick("options")}
            >
              <img
                src="/assets/chart-line.svg"
                alt="Options"
                className={`${activeTab === "options"
                  ? "brightness-200"
                  : "brightness-100 group-hover:brightness-200"
                  }`}
              />
              Options Trading
            </li>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Login/User Button */}
          {!authKey ? (
            <Button
              type="navdisconnected"
              onClick={() => setShowLogin(true)}
            >
              Connect
            </Button>
          ) : (
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Button
                type="navconnected"
              >
                Connected
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 bg-backgrounddark text-white rounded shadow-lg z-50 p-2">
                  <Button
                    type="button-base button-danger"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="relative" ref={settingsRef}>
            <button
              className="px-2 py-2 bg-backgroundlight rounded-md text-sm font-semibold hover:bg-primary2deactive transition"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <img src="/assets/settings-icon.svg" alt="Settings" className="w-5 h-5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-backgrounddark text-white rounded shadow-lg z-50 p-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.skipOpenOrderConfirmation}
                      onChange={() => handleSettingChange('skipOpenOrderConfirmation')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Skip Open Order Confirmation
                  </label>
                  {/* Rest of settings UI remains the same */}
                  {/* ... */}
                  <button
                    className="w-full py-2 bg-secondary2 rounded hover:bg-secondary2/80 transition mt-2"
                    onClick={() => setSettings(initialSettings)}
                  >
                    Reset layout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Login Popup Modal */}
      {showLogin && (
        <LoginPanel
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Debugger Panel as draggable 
      {showDebugger && (
        <Draggable handle=".debugger-drag-handle">
          <div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-backgrounddark text-white rounded-lg shadow-2xl border border-primary2 w-[600px] max-w-[95vw] max-h-[80vh] flex flex-col"
            style={{ minHeight: "400px" }}
          >
            <div className="debugger-drag-handle cursor-move bg-primary2 px-4 py-2 rounded-t-lg flex items-center justify-between">
              <span className="font-bold text-lg">Debugger</span>
              <button
                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
                onClick={() => setShowDebugger(false)}
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4 flex-1">
              <DebuggerPanel />
            </div>
          </div>
        </Draggable>
      )}*/}
    </>
  );
}

export default Navbar;