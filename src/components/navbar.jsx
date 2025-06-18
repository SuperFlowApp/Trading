import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authentication"; // <-- Import useAuth
import AuthPanel from "./LoginPanel";
import ManageAccountModal from "./ManageAccountModal";

function Navbar() {
  const [showLogin, setShowLogin] = useState(false);
  const [showManageAccount, setShowManageAccount] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Callback for AuthPanel to close modal on login
  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  return (
    <>
      <nav className="pl-[20px] pr-[30px] w-full flex items-center justify-between px-4 py-2 bg-backgrounddark/50 text-white ">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <img src="/assets/Logo.svg" alt="Logo" className="h-8 w-auto" />

          <ul className="flex gap-6 text-sm font-small">
            <li className="flex items-center gap-2 cursor-pointer hover:text-[#FFFFFF]">
              <img src="/assets/trading-view-candles.svg" alt="Trade Icon" className="w-4 h-4" />
              Trade
            </li>
            <li className="flex items-center gap-2 cursor-pointer text-secondary1 hover:text-[#FFFFFF]">
              <img src="/assets/maney.svg" alt="Earn Icon" className="w-4 h-4" />
              Earn Points
            </li>
            <li className="flex items-center gap-2 cursor-pointer text-secondary1 hover:text-[#FFFFFF]">
              <img src="/assets/group.svg" alt="Referral Icon" className="w-4 h-4" />
              Referrals
            </li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Deposit Button */}
          <button
            className="flex text-black items-center gap-2 px-4 py-2 bg-primary2 rounded-md text-sm font-semibold hover:bg-primary2/80 transition"
            onClick={() => alert("Deposit clicked!")}
          >
            <img src="/assets/left_icon.svg" alt="Deposit Icon" className="w-4 h-4" />
            Deposit
          </button>
          {/* Login/User Button */}
          {!accessToken ? (
            <button
              className="px-4 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-secondary2/80 transition"
              onClick={() => setShowLogin(true)}
            >
              Login
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
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <button className="px-2 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-opacity-80 transition">
            <img src="/assets/language-icon.svg" alt="Language" className="w-5 h-5" />
          </button>
          <button className="px-2 py-2 bg-secondary2 rounded-md text-sm font-semibold hover:bg-opacity-80 transition">
            <img src="/assets/settings-icon.svg" alt="Settings" className="w-5 h-5" />
          </button>
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
              hideClose={true}
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
