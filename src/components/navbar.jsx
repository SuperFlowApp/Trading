import { useState, useEffect, useRef } from "react";
import 'antd/dist/reset.css';
import DefaultAPILogin from "./Login/defaultAPILogin";
import DefaultAPISignup from "./Login/defaultAPISignup"; // Import the signup modal
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import context
import Button from "./CommonUIs/Button";
import SettingsDropdown from "./SettingsDropdown"; // Add this import

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
  const { authKey, setAuthKey, username, setUsername } = useAuthKey(); // <-- use context username
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // State for signup modal
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes("options-trading")) return "options";
    return "futures";
  });
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

  const handleLoginSuccess = (username, token) => {
    setShowLogin(false);
    setDropdownOpen(false);
    console.log(`User ${username} logged in successfully with token: ${token}`);
  };

  const handleSignupSuccess = (username) => {
    setShowSignup(false);
    console.log(`User ${username} signed up successfully!`);
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
    setAuthKey(null);
    setUsername(null); // Also clear the username
  };

  return (
    <>
      <nav className=" w-full flex items-center justify-between px-4 py-3 bg-backgroundmid text-white text-body">
        <div className="flex items-center justify-between self-center max-w-[1900px] mx-auto w-full">
          {/* Left Side */}
          <div className="flex items-center gap-14">
            <div className="flex items-end gap-2">
              <img src="/assets/Logo.svg" alt="Logo" className="h-[30px] w-auto" />
              <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto" />

            </div>
            <div className="flex items-center gap-14">

              <li
                className={`group flex items-center gap-2 cursor-pointer ${activeTab === "futures" ? "text-liquidwhite" : "text-liquidlightergray hover:text-liquidwhite"
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
                className={`group flex items-center gap-2 cursor-pointer ${activeTab === "options" ? "text-liquidwhite" : "text-liquidlightergray hover:text-liquidwhite"
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
                Login
              </Button>
            ) : (
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <Button type="navconnected">
                  {username} {/* Show username if available */}
                </Button>
                {dropdownOpen && (
                  <div className="absolute right-0 text-liquidwhite rounded z-50 py-2">
                    <Button
                      type="navdisconnection"
                      onClick={handleDisconnect}
                    >
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Signup Button */}
            {!authKey && (
              <Button
                type="navsignup"
                onClick={() => setShowSignup(true)}
              >
                Sign Up
              </Button>
            )}
            <SettingsDropdown
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              settings={settings}
              setSettings={setSettings}
              handleSettingChange={handleSettingChange}
              settingsRef={settingsRef}
            />
          </div>
        </div>
      </nav>

      {/* Login Popup Modal */}
      {showLogin && (
        <DefaultAPILogin
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Signup Popup Modal */}
      {showSignup && (
        <DefaultAPISignup
          open={showSignup}
          onClose={() => setShowSignup(false)}
          onSignupSuccess={handleSignupSuccess}
        />
      )}
    </>
  );
}

export default Navbar;