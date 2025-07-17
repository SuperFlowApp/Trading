import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authentication";
import EmailLoginPanel from "./EmailLoginPanel";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

function getDetectedWallet() {
  if (typeof window !== "undefined" && window.ethereum && window.ethereum.isMetaMask) {
    return { name: "MetaMask", icon: "/assets/metamask.svg" };
  }
  return null;
}

// Helper to shorten wallet address
export const shortenAddress = (addr) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

function AuthPanel({ onLoginSuccess, onClose }) {
  const [connectionMethod, setConnectionMethod] = useState(null); // "email" | "metamask" | null
  const [detectedWallet, setDetectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [termsStep, setTermsStep] = useState(false);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);
  const [signature, setSignature] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [responseData, setResponseData] = useState(null);
  
  // Web3 wallet states
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState("");

  // Use AuthContext
  const { token, logout } = useAuth();

  const inactivityTimeout = useRef(null);

  // Inactivity logout effect
  useEffect(() => {
    if (!token) return;

    const logoutAfterInactivity = () => {
      logoutUser();
    };

    const resetTimer = () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(logoutAfterInactivity, 10 * 60 * 1000); // 10 minutes
    };

    // Listen to user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer(); // Start timer on mount

    return () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [token]);

  useEffect(() => {
    setDetectedWallet(getDetectedWallet());
  }, []);

  // Connect wallet using Web3Modal
  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal();
      const instance = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(instance);
      setProvider(ethersProvider);
      const signer = ethersProvider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
      setWalletAddress(userAddress);
      
      // Notify parent component about successful connection
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(userAddress);
      }
      
      // Close the modal after successful connection
      if (typeof onClose === "function") {
        onClose();
      }
      
      return { success: true, address: userAddress };
    } catch (error) {
      setWalletError("Failed to connect wallet: " + error.message);
      return { success: false, error: error.message };
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setProvider(null);
    setAddress("");
    setWalletAddress("");
    
    // Clear cached provider so web3modal pops up next time
    if (window.localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")) {
      window.localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    }
    
    // Attempt to revoke permissions (if supported by wallet)
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (e) {
        // Ignore errors or handle gracefully
      }
    }
    
    localStorage.removeItem("walletAddress");
    return { success: true };
  };

  // Logout user from auth context
  const logoutUser = () => {
    logout();
    localStorage.removeItem("username");
    disconnectWallet(); // Also disconnect wallet when logging out
  };

  // --- Accept terms signature handler ---
  const handleAcceptTerms = async () => {
    setWalletError("");
    if (!window.ethereum || !walletAddress) return;
    const now = Date.now();
    const msgParams = {
      domain: { name: "TradingApp", version: "1" },
      message: { time: now },
      primaryType: "SuperFlow:Accept terms",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" }
        ],
        "SuperFlow:Accept terms": [
          { name: "time", type: "string" }
        ]
      }
    };
    try {
      const sig = await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [walletAddress, JSON.stringify(msgParams)]
      });
      setSignature(sig);
      setWalletError("");
      // Call onLoginSuccess with wallet address
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(walletAddress);
      }
    } catch (err) {
      setWalletError("Signature rejected.");
    }
  };

  const handleEmailLoginSuccess = (token, username) => {
    localStorage.setItem("username", username);
    if (typeof onClose === "function") onClose(); // Close panel after login
  };

  // --- UI ---
  return (
    <div className="bg-backgroundlight text-white px-8 py-12 rounded-lg w-full max-w-md mx-auto space-y-4 border border-secondary2 relative">
      {/* Title */}
      <div className="text-2xl font-medium text-center pb-2 cursor-default">
        {connectionMethod === "email"
          ? isSignup
            ? "Sign up"
            : "Login"
          : "Connect"}
      </div>
      {/* Close X button */}
      <button
        className="absolute top-2 right-4 text-5xl font-light text-white hover:text-primary2 focus:outline-none"
        style={{ lineHeight: "0.25", fontSize: "3.5rem" }}
        onClick={() => {
          setConnectionMethod(null);
          setWalletAddress("");
          setTermsStep(false);
          setCheckbox1(false);
          setCheckbox2(false);
          setSignature("");
          setWalletError("");
          setIsSignup(false); // <-- Always reset to login mode
          if (typeof onClose === "function") onClose();
        }}
        aria-label="Close"
        type="button"
      >
        ×
      </button>

      {/* Top-level menu */}
      {!connectionMethod && (
        <div className="flex flex-col gap-4">
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80"
            onClick={() => setConnectionMethod("email")}
          >
            Login with Email
          </button>
          {/* Divider with "or" */}
          <div className="flex items-center my-1 cursor-default">
            <div className="flex-1 h-px bg-gray-500 opacity-40" />
            <span className="mx-2 text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-500 opacity-40" />
          </div>
          {/* Always show wallet button, use detectedWallet if present, else show default */}
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
            onClick={async () => {
              setWalletError("");
              if (detectedWallet) {
                // MetaMask or other detected wallet
                if (!window.ethereum || !window.ethereum.isMetaMask) {
                  setWalletError("MetaMask not detected.");
                  return;
                }
                try {
                  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                  setWalletAddress(accounts[0]);
                  setTermsStep(true);
                  setConnectionMethod("metamask");
                } catch (err) {
                  setWalletError("MetaMask connection rejected.");
                }
              } else {
                // No wallet detected, just show error or do nothing
                setWalletError("No wallet detected in browser.");
              }
            }}
            type="button"
          >
            {detectedWallet ? (
              <>
                <img src={detectedWallet.icon} alt={detectedWallet.name} className="w-5 h-5" />
                {detectedWallet.name}
              </>
            ) : (
              <>
                <img src="/assets/defaultWallet.svg" alt="Default wallet" className="w-5 h-5" />
                Default wallet
              </>
            )}
          </button>

          {/* Additional wallets - Web3Modal button */}
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
            type="button"
            onClick={connectWallet}
          >
            <img src="/assets/WalletConnect.svg" alt="WalletConnect" className="w-6 h-6" />
            Connect with Web3Modal
          </button>
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
            type="button"
            onClick={() => setWalletError("OKX Wallet integration coming soon.")}
          >
            <img src="/assets/OKX.svg" alt="OKX Wallet" className="w-6 h-6" />
            OKX Wallet
          </button>
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
            type="button"
            onClick={() => setWalletError("Coinbase Wallet integration coming soon.")}
          >
            <img src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4" alt="Coinbase Wallet" className="w-6 h-6" />
            Coinbase Wallet
          </button>
          {/* End additional wallets */}
          {walletError && (
            <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-2">
              {walletError}
            </div>
          )}
        </div>
      )}

      {/* Email login/signup panel */}
      {connectionMethod === "email" && (
        <EmailLoginPanel
          onBack={() => {
            setConnectionMethod(null);
            setIsSignup(false);
          }}
          onLoginSuccess={handleEmailLoginSuccess}
          isSignup={isSignup}
          setIsSignup={setIsSignup}
          responseData={responseData}
          setResponseData={setResponseData}
        />
      )}

      {/* MetaMask terms flow */}
      {connectionMethod === "metamask" && (
        <>
          {walletAddress && !signature && (
            <div className="space-y-4 text-[12px]">
              <div className="mb-2 text-lg font-bold">Accept Terms</div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkbox1}
                    onChange={e => setCheckbox1(e.target.checked)}
                  />
                  <span>We acknowledge that you have read, understood, and agreed to the Terms of Use and Privacy policy.</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkbox2}
                    onChange={e => setCheckbox2(e.target.checked)}
                  />
                  <span>This site uses cookies to ensure the best user experience. These cookies are strictly necessary or essential for optimal functionality. By using this site, you agree to the coockie policy.</span>
                </label>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  className={`px-4 py-2 rounded font-medium hover:bg-opacity-80
    ${checkbox1 && checkbox2
                      ? "bg-primary2 text-black"
                      : "bg-gray-500 text-gray-300"
                    }`}
                  onClick={handleAcceptTerms}
                  type="button"
                  disabled={!(checkbox1 && checkbox2)}
                >
                  Accept
                </button>
                <button
                  className="bg-warningcolor text-white px-4 py-2 rounded font-medium hover:bg-opacity-80"
                  type="button"
                  onClick={() => {
                    setConnectionMethod(null);
                    setWalletAddress("");
                    setTermsStep(false);
                    setCheckbox1(false);
                    setCheckbox2(false);
                    setSignature("");
                    setWalletError("");
                  }}
                >
                  Decline
                </button>
              </div>
              {walletError && (
                <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-2">
                  {walletError}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Export functions for external use
export default AuthPanel;