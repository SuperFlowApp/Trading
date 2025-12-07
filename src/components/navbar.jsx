import { useState, useEffect, useRef } from "react";
import 'antd/dist/reset.css';
import DefaultAPILogin from "./Login/defaultAPILogin";
import { useAuthKey } from "../contexts/AuthKeyContext";
import Button from "./CommonUIs/Button";
import SettingsDropdown from "./SettingsDropdown";
import { Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LoginPanel from "./Login/LoginPanel";

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
  const { authKey, setAuthKey, username, setUsername } = useAuthKey();
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
    <Disclosure as="nav" className="bg-boxbackground text-white text-body w-full border-b-[1px] border-borderscolor" >
      {({ open }) => (
        <>
          <div className="mx-auto w-full px-4 py-3 flex items-center justify-between ">
            {/* Left: Logo and Tabs */}
            <div className="flex items-center gap-4 flex-1">
              {/* Replaced logo with Cloverfield SVG */}
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.1993 15.7343L15.7343 14.1992C15.8811 14.0525 16.1189 14.0525 16.2657 14.1992L17.8008 15.7343C17.9475 15.881 17.9475 16.1189 17.8008 16.2657L16.2657 17.8007C16.1189 17.9475 15.8811 17.9475 15.7343 17.8007L14.1993 16.2657C14.0525 16.1189 14.0525 15.881 14.1993 15.7343Z" fill="#8AABB2"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.7343 0.110043L0.110044 15.7343C-0.0366811 15.8811 -0.0366813 16.1189 0.110043 16.2657L15.7343 31.89C15.8811 32.0367 16.1189 32.0367 16.2657 31.89L31.89 16.2657C32.0367 16.1189 32.0367 15.8811 31.89 15.7343L16.2657 0.110043C16.1189 -0.0366812 15.8811 -0.0366811 15.7343 0.110043ZM13.6638 5.59664L16.0718 8.00461L18.4797 5.59666C20.3641 6.03094 22.1535 6.98217 23.6217 8.45037C25.09 9.91862 26.0412 11.7081 26.4755 13.5926L24.0675 16.0006L26.4754 18.4085C26.0411 20.2928 25.0899 22.0822 23.6217 23.5504C22.1534 25.0187 20.3639 25.9699 18.4793 26.4042L16.0716 23.9965L13.6639 26.4041C11.7794 25.9699 9.98997 25.0186 8.52171 23.5504C7.0535 22.0822 6.10226 20.2927 5.66799 18.4083L8.07575 16.0006L5.66791 13.5927C6.10215 11.7082 7.05341 9.91866 8.52171 8.45037C9.98993 6.98214 11.7794 6.0309 13.6638 5.59664Z" fill="#8AABB2"></path>
                </svg>
                <span className="ml-2 text-lg font-semibold text-[#AEE3FA]">Cloverfield</span>
                <img src="/assets/Bysymmio.svg" alt="Logo" className="h-4 w-auto -mb-1.5" />
              </div>

              <ul className="hidden sm:flex items-center gap-14 ml-6">
                <li
                  className={`group flex items-center gap-2 cursor-pointer ${activeTab === "futures" ? "text-liquidwhite" : "text-color_lighter_gray hover:text-liquidwhite"
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
                  className={`group flex items-center gap-2 cursor-pointer ${activeTab === "options" ? "text-liquidwhite" : "text-color_lighter_gray hover:text-liquidwhite"
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
                    Connect
                  </Button>
                </>
              ) : (
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <Button type="navconnected"
                    style={{
                      border: '1px solid var(--color-primary2normal)'
                    }}
                  >{username}</Button>

                  {dropdownOpen && (
                    <div className="absolute right-0 text-liquidwhite rounded z-50 py-2">
                      <Button
                        type="navdisconnection"
                        onClick={handleDisconnect}
                        style={{
                          border: '1px solid var(--color-primary2normal)'
                        }}
                      >
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
              <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-color_lighter_gray hover:text-white hover:bg-backgroundlight focus:outline-none">
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
            <Disclosure.Panel static className="sm:hidden bg-boxbackground px-4 pt-2 pb-3 space-y-1 ">
              <ul className="flex flex-col items-center gap-2 mb-8">
                <li
                  className={`flex items-center gap-2 cursor-pointer ${activeTab === "futures" ? "text-liquidwhite" : "text-color_lighter_gray hover:text-liquidwhite"
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
                  className={`flex items-center gap-2 cursor-pointer ${activeTab === "options" ? "text-liquidwhite" : "text-color_lighter_gray hover:text-liquidwhite"
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

          {/* Login Modal */}
          {showLogin && (
            <LoginPanel
              open={showLogin}
              onClose={() => setShowLogin(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </>
      )}
    </Disclosure>
  );
}

export default Navbar;