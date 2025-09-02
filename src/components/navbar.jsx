import { useState, useEffect, useRef } from "react";
import 'antd/dist/reset.css';
import DefaultAPILogin from "./Login/defaultAPILogin";
import DefaultAPISignup from "./Login/defaultAPISignup"; // Import the signup modal
import { useAuthKey } from "../contexts/AuthKeyContext"; // <-- import context
import Button from "./CommonUIs/Button";
import SettingsDropdown from "./SettingsDropdown"; // Add this import
import { Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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
    <Disclosure as="nav" className="bg-backgroundmid text-white text-body w-full">
      {({ open }) => (
        <>
          <div className="mx-auto w-full px-4 py-3 flex items-center justify-between ">
            {/* Left: Logo and Tabs */}
            <div className="flex items-center gap-4 flex-1">
              <img src="/assets/Logo.svg" alt="Logo" className="h-[30px] w-auto" />
              <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto" />
              <ul className="hidden sm:flex items-center gap-14 ml-6">
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
              </ul>
            </div>
            {/* Desktop Right Side */}
            <div className="hidden sm:flex items-center gap-4">
              {!authKey ? (
                <>
                  <Button type="navdisconnected" onClick={() => setShowLogin(true)}>
                    Login
                  </Button>
                  <Button type="navsignup" onClick={() => setShowSignup(true)}>
                    Sign Up
                  </Button>
                </>
              ) : (
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <Button type="navconnected">{username}</Button>
                  {dropdownOpen && (
                    <div className="absolute right-0 text-liquidwhite rounded z-50 py-2">
                      <Button type="navdisconnection" onClick={handleDisconnect}>
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
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
            {/* Mobile Hamburger */}
            <div className="flex sm:hidden">
              <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-liquidlightergray hover:text-white hover:bg-backgroundlight focus:outline-none">
                {open ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </Disclosure.Button>
            </div>
          </div>
          {/* Mobile Menu */}
          <Transition
            show={open}
            enter="transition ease-out duration-300"
            enterFrom="-translate-y-10 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition ease-in duration-200"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="-translate-y-10 opacity-0"
          >
            <Disclosure.Panel static className="sm:hidden bg-backgroundmid px-4 pt-2 pb-3 space-y-1 ">
              <ul className="flex flex-col items-center gap-2 mb-8">
                <li
                  className={`flex items-center gap-2 cursor-pointer ${activeTab === "futures" ? "text-liquidwhite" : "text-liquidlightergray hover:text-liquidwhite"
                    }`}
                  onClick={() => handleTabClick("futures")}
                >
                  <img
                    src="/assets/chart-candlestick.svg"
                    alt="Futures"
                    className={` ${activeTab === "futures"
                      ? "brightness-200"
                      : "brightness-100"
                      }`}
                  />
                  Futures Trading
                </li>
                <li
                  className={`flex items-center gap-2 cursor-pointer ${activeTab === "options" ? "text-liquidwhite" : "text-liquidlightergray hover:text-liquidwhite"
                    }`}
                  onClick={() => handleTabClick("options")}
                >
                  <img
                    src="/assets/chart-line.svg"
                    alt="Options"
                    className={`${activeTab === "options"
                      ? "brightness-200"
                      : "brightness-100"
                      }`}
                  />
                  Options Trading
                </li>
              </ul>
              <div className="flex flex-col gap-2 mt-2">
                {!authKey ? (
                  <>
                    <Button type="navdisconnected" onClick={() => setShowLogin(true)}>
                      Login
                    </Button>
                    <Button type="navsignup" onClick={() => setShowSignup(true)}>
                      Sign Up
                    </Button>
                  </>
                ) : (
                  <Button type="navconnected" onClick={handleDisconnect}>
                    Logout
                  </Button>
                )}
                <div className="flex w-full justify-end">
                  <SettingsDropdown
                    settingsOpen={settingsOpen}
                    setSettingsOpen={setSettingsOpen}
                    settings={settings}
                    setSettings={setSettings}
                    handleSettingChange={handleSettingChange}
                    settingsRef={settingsRef}
                    isMobile
                  />
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>

          {/* Login/Signup Modals */}
          {showLogin && (
            <DefaultAPILogin
              open={showLogin}
              onClose={() => setShowLogin(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
          {showSignup && (
            <DefaultAPISignup
              open={showSignup}
              onClose={() => setShowSignup(false)}
              onSignupSuccess={handleSignupSuccess}
            />
          )}
        </>
      )}
    </Disclosure>
  );
}

export default Navbar;