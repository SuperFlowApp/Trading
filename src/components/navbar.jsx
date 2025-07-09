import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authentication"; // <-- Import useAuth
import AuthPanel from "./LoginPanel";
import ManageAccountModal from "./ManageAccountModal";

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
  const [showLogin, setShowLogin] = useState(false);
  const [showManageAccount, setShowManageAccount] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  // Use AuthContext for auth state
  const { token: accessToken, logout, token } = useAuth();
  const username = localStorage.getItem("username") || "";

  // Handle logout using AuthContext
  const handleLogout = () => {
    logout(); // <-- Use AuthContext logout
    setDropdownOpen(false);
    setShowManageAccount(false);
    setShowLogin(false);
  };

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

  // Listen for clicks outside settings to close it
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

  // Callback for AuthPanel to close modal on login
  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <nav className="pl-[20px] pr-[30px] w-full flex items-center justify-between px-4 py-2 bg-backgrounddark text-white ">
        {/* Left Side */}
        <div className="flex items-center gap-14">
          <div className="flex items-end gap-2">
            <img src="/assets/Logo.svg" alt="Logo" className="h-8 w-auto" />
            <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto" />
          </div>
          <ul className="flex gap-6 text-sm font-small">
            <li className="flex items-center gap-2 cursor-pointer hover:text-[#FFFFFF]">
              Trade
            </li>
            <li className="flex items-center gap-2 cursor-pointer text-secondary1 hover:text-[#FFFFFF]">
              Earn Points
            </li>
            <li className="flex items-center gap-2 cursor-pointer text-secondary1 hover:text-[#FFFFFF]">
              Referrals
            </li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Login/User Button */}
          {!accessToken ? (
            <button
              className="px-4 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-secondary2/80 transition"
              onClick={() => setShowLogin(true)}
            >
              Connect
            </button>
          ) : (
            <div
              className="relative"
              ref={dropdownRef}
              style={{ display: "inline-block" }}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className="px-4 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-opacity-80 transition"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                {username}
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-0 w-20 bg-secondary2 rounded shadow-lg z-50"
                  style={{ top: "100%" }}
                >
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-opacity-80"
                    onClick={handleLogout}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
          {/*
          <button className="px-2 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-opacity-80 transition">
            <img src="/assets/language-icon.svg" alt="Language" className="w-5 h-5" />
          </button>
          */}
          <div className="relative" ref={settingsRef}>
            <button
              className="px-2 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-opacity-80 transition"
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
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.skipClosePositionConfirmation}
                      onChange={() => handleSettingChange('skipClosePositionConfirmation')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Skip Close Position Confirmation
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.optOutSpotDusting}
                      onChange={() => handleSettingChange('optOutSpotDusting')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Opt Out of Spot Dusting
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.persistTradingConnection}
                      onChange={() => handleSettingChange('persistTradingConnection')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Persist Trading Connection
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.customizeLayout}
                      onChange={() => handleSettingChange('customizeLayout')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Customize Layout
                  </label>
                  <hr className="my-2 border-secondary2" />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.displayVerboseErrors}
                      onChange={() => handleSettingChange('displayVerboseErrors')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Display Verbose Errors
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.disableBackgroundFillNotifications}
                      onChange={() => handleSettingChange('disableBackgroundFillNotifications')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Disable Background Fill Notifications
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.disablePlayingSoundForFills}
                      onChange={() => handleSettingChange('disablePlayingSoundForFills')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Disable Playing Sound For Fills
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.animateOrderBook}
                      onChange={() => handleSettingChange('animateOrderBook')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Animate Order Book
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.orderBookSetSizeOnClick}
                      onChange={() => handleSettingChange('orderBookSetSizeOnClick')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Order Book Set Size on Click
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.showBuysAndSellsOnChart}
                      onChange={() => handleSettingChange('showBuysAndSellsOnChart')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Show Buys and Sells on Chart
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.hidePNL}
                      onChange={() => handleSettingChange('hidePNL')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Hide PNL
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.showAllWarnings}
                      onChange={() => handleSettingChange('showAllWarnings')}
                      className="hidden peer"
                    />
                    <span className="w-4 h-4 rounded border border-secondary2 flex items-center justify-center peer-checked:bg-primary2 transition-colors"></span>
                    Show All Warnings
                  </label>
                  <hr className="my-2 border-secondary2" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className=" rounded-lg shadow-lg p-0 relative w-full max-w-md">
            <button
              className="absolute top-2 right-2 text-white text-xl"
              onClick={() => setShowLogin(false)}
            >
              &times;
            </button>
            <AuthPanel
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setShowLogin(false)}
            />
          </div>
        </div>
      )}

      {/* Manage Account Modal */}
      {showManageAccount && (
        <ManageAccountModal
          accessToken={accessToken}
          apiKeyData={null}
          onClose={() => setShowManageAccount(false)}
        />
      )}
    </>
  );
}

export default Navbar;
