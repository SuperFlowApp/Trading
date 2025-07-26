import { useState, useEffect, useRef } from "react";
import { Modal, notification, message } from 'antd';
import 'antd/dist/reset.css';
import LoginPanel from "./Login/LoginPanel";
import { getAuthKey } from "../utils/authKeyStorage";
import Button from "./CommonUIs/Button"; // <-- Add this import

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
  // Fetch authKey from native storage instead of Zustand
  const [accessToken, setAccessToken] = useState(getAuthKey());

  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes("options-trading")) return "options";
    return "futures";
  });
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  // Listen for authKey changes (multi-tab support)
  useEffect(() => {
    const handler = () => setAccessToken(getAuthKey());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

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
    setAccessToken(getAuthKey());
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
    localStorage.clear(); // Clear all localStorage, not just authKey
    setAccessToken(null);
    setDropdownOpen(false);
    message.info("Disconnected"); // Show top notification
  };

  return (
    <>
      <nav className="pl-[20px] pr-[30px] w-full flex items-center justify-between px-4 py-2 bg-backgroundmid text-white ">
        {/* Left Side */}
        <div className="flex items-center gap-14">
          <div className="flex items-end gap-2">
            <img src="/assets/Logo.svg" alt="Logo" className="h-8 w-auto" />
            <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto" />
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
          {!accessToken ? (
            <Button
              type="primary"
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
                type="secondary"
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
    </>
  );
}

export default Navbar;