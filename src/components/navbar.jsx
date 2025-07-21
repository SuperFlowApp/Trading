import { useState, useEffect, useRef } from "react";
import AuthPanel, { shortenAddress } from "./Login/LoginPanel";
import ManageAccountModal from "./Login/ManageAccountModal";

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
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem("walletAddress") || ""); // <-- Retrieve from localStorage if available
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes("options-trading")) return "options";
    return "futures";
  });
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);
  const authPanelRef = useRef(null);

  // Instead, rely on walletAddress or other props/state for login status
  const username = localStorage.getItem("username") || "";

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
  const handleLoginSuccess = (walletAddr) => {
    setShowLogin(false);
    if (walletAddr) {
      setWalletAddress(walletAddr);
      localStorage.setItem("walletAddress", walletAddr);
    }
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

  // Effect to handle wallet connection and disconnection
  useEffect(() => {
    // Only run if MetaMask is present
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          setWalletAddress("");
          localStorage.removeItem("walletAddress");
        } else {
          setWalletAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        }
      };

      const handleDisconnect = () => {
        setWalletAddress("");
        localStorage.removeItem("walletAddress");
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      // On mount, check if still connected
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (!accounts || accounts.length === 0) {
          setWalletAddress("");
          localStorage.removeItem("walletAddress");
        }
      });

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      };
    }
  }, []);

  useEffect(() => {
    // Function to check connection status
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        setIsConnected(accounts.length > 0);
      }
    };

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", checkConnection);
      window.ethereum.on("disconnect", () => setIsConnected(false));
    }

    // Initial check
    checkConnection();

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", checkConnection);
        window.ethereum.removeListener("disconnect", () => setIsConnected(false));
      }
    };
  }, []);

  // Add this function inside Navbar
  const handleDisconnectWallet = async () => {
    setWalletAddress("");
    localStorage.removeItem("walletAddress");
    setDropdownOpen(false);
    setIsConnected(false);
    // Optionally, revoke permissions if supported
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (e) {
        // Ignore errors
      }
    }
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
          <ul className="flex gap-6 text-sm font-small">
            <li
              className={`group flex items-center gap-2 cursor-pointer ${
                activeTab === "futures" ? "text-white" : "text-secondary1"
              }`}
              onClick={() => handleTabClick("futures")}
            >
              <img
                src="/assets/chart-candlestick.svg"
                alt="Futures"
                className={`w-5 h-5 ${
                  activeTab === "futures"
                    ? "brightness-200"
                    : "brightness-100 group-hover:brightness-200"
                }`}
              />
              Futures Trading
            </li>
            <li
              className={`group flex items-center gap-2 cursor-pointer ${
                activeTab === "options" ? "text-white" : "text-secondary1"
              }`}
              onClick={() => handleTabClick("options")}
            >
              <img
                src="/assets/chart-line.svg"
                alt="Options"
                className={`w-5 h-5 ${
                  activeTab === "options"
                    ? "brightness-200"
                    : "brightness-100 group-hover:brightness-200"
                }`}
              />
              Options Trading
            </li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Login/User Button */}
          {!walletAddress ? (
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
                {walletAddress
                  ? shortenAddress(walletAddress)
                  : username}
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-0 w-26 bg-secondary2 rounded shadow-lg z-50"
                  style={{ top: "100%" }}
                >
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-opacity-80"
                    onClick={handleDisconnectWallet} // <-- Change here
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg shadow-lg p-0 relative w-full max-w-md">
            <button
              className="absolute top-2 right-2 text-white text-xl"
              onClick={() => setShowLogin(false)}
            >
              &times;
            </button>
            <AuthPanel
              ref={authPanelRef}
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