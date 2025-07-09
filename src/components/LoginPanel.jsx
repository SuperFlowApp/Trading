import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authentication";
import metamaskLogo from "/assets/metamask.svg";

function getDetectedWallet() {
  if (typeof window !== "undefined" && window.ethereum && window.ethereum.isMetaMask) {
    return { name: "MetaMask", icon: metamaskLogo };
  }
  return null;
}

function AuthPanel({ onLoginSuccess, onClose }) {
  const [connectionMethod, setConnectionMethod] = useState(null); // "email" | "metamask" | null
  const [detectedWallet, setDetectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [termsStep, setTermsStep] = useState(false);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);
  const [signature, setSignature] = useState("");
  const [walletError, setWalletError] = useState("");

  // Email login/signup states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState("");
  const [repeatPasswordTouched, setRepeatPasswordTouched] = useState(false);

  // Validation error states
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  // Use AuthContext
  const { token, login, logout } = useAuth();

  const inactivityTimeout = useRef(null);

  // Restore username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // Inactivity logout effect
  useEffect(() => {
    if (!token) return;

    const logoutAfterInactivity = () => {
      logoutUser();
      setResponseData({ msg: "Logged out due to inactivity." });
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

  // --- Signup handler ---
  const createUser = async () => {
    setSignupError("");
    let valid = true;
    if (!validateUsername(username)) {
      setUsernameTouched(true);
      setSignupError("Username must be at least 4 letters.");
      valid = false;
    }
    if (!validatePassword(password)) {
      setPasswordTouched(true);
      setSignupError("Password must have 1 uppercase letter, 1 number and 1 special character.");
      valid = false;
    }
    if (password !== repeatPassword) {
      setRepeatPasswordTouched(true);
      setSignupError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    setResponseData({ msg: "Signing up..." });
    try {
      const result = await signup(username, password);
      if (result.success) {
        setUserId(result.data.userId || null);
        setResponseData({ msg: "Signup successful!", detail: result.data });
        setSignupError("");
        setIsSignup(false); // Switch to login after signup
      } else {
        setSignupError(result.error || "Signup failed.");
        setResponseData({ msg: "Signup failed", detail: result.data });
      }
    } catch (err) {
      setSignupError("Signup error: " + (err?.message || err));
      setResponseData({ msg: "Signup error", detail: err?.message || err });
    }
  };

  // --- Login handler using AuthContext ---
  const handleLogin = async () => {
    setLoginError("");
    let valid = true;
    if (!validateUsername(username)) {
      setUsernameTouched(true);
      setLoginError("Username must be at least 4 letters.");
      valid = false;
    }
    if (!validatePassword(password)) {
      setPasswordTouched(true);
      setLoginError("Password must have 1 uppercase letter, 1 number and 1 special character.");
      valid = false;
    }
    if (!valid) return;
    setResponseData({ msg: "Logging in..." });
    try {
      const result = await login(username, password);
      if (result.success) {
        setResponseData({ msg: "Logged in successfully", detail: result.token });
        // Store username in localStorage
        localStorage.setItem("username", username);
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(result.token, username);
        }
        setPassword(""); // Clear old password after login
      } else {
        setResponseData({ msg: "Failed to log in", detail: result.error });
      }
    } catch (err) {
      setResponseData({ msg: "Login error" });
    }
  };

  const logoutUser = () => {
    logout();
    setUserId(null);
    setResponseData({ msg: "Logged out" });
    setUsername("");
    setPassword("");
    localStorage.removeItem("username"); // Remove username on logout
  };
  // Signup function: create user on server
  const signup = async (username, password) => {
    try {
      const res = await fetch(
        `https://fastify-serverless-function-rimj.onrender.com/api/create_user?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );
      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: await res.text() };
      }
      if (res.ok && !data.error) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || "Signup failed", data };
      }
    } catch (err) {
      return { success: false, error: err?.message || "Signup error" };
    }
  };
  // --- Wallet connect handler ---
  const handleMetaMaskConnect = async () => {
    setWalletError("");
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      setWalletError("MetaMask not detected.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setTermsStep(true);
    } catch (err) {
      setWalletError("MetaMask connection rejected.");
    }
  };

  // --- Accept terms signature handler ---
  const handleAcceptTerms = async () => {
    setWalletError("");
    if (!window.ethereum || !walletAddress) return;
    const now = Date.now(); // <-- Use Unix timestamp in ms
    // EIP-712 typed data for "SuperFlow:Accept terms" with time
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
      // You can now send the signature to your backend for verification if needed
    } catch (err) {
      setWalletError("Signature rejected.");
    }
  };

  // --- UI ---
  return (
    <div className="bg-backgroundlight text-white px-4 py-12 rounded-lg w-full max-w-md mx-auto space-y-4 border border-secondary2 relative">
      {/* Close X button */}
      <button
        className="absolute top-0 right-2 text-5xl font-medium text-white hover:text-primary2 focus:outline-none"
        style={{ lineHeight: "1", fontSize: "3.5rem" }}
        onClick={() => {
          setConnectionMethod(null);
          setWalletAddress("");
          setTermsStep(false);
          setCheckbox1(false);
          setCheckbox2(false);
          setSignature("");
          setWalletError("");
          setIsSignup(false);
          setLoginError("");
          setSignupError("");
          setUsernameTouched(false);
          setPasswordTouched(false);
          setRepeatPasswordTouched(false);
          setUsername("");
          setPassword("");
          setRepeatPassword("");
          setResponseData(null);
          setUserId(null);
          if (typeof onClose === "function") onClose(); // <-- Close the panel
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
          <div className="flex items-center my-1">
            <div className="flex-1 h-px bg-gray-500 opacity-40" />
            <span className="mx-2 text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-500 opacity-40" />
          </div>
          {detectedWallet && (
            <button
              className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
              onClick={async () => {
                setWalletError("");
                if (!window.ethereum || !window.ethereum.isMetaMask) {
                  setWalletError("MetaMask not detected.");
                  return;
                }
                try {
                  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                  setWalletAddress(accounts[0]);
                  setTermsStep(true);
                  setConnectionMethod("metamask"); // Only show terms after successful connect
                } catch (err) {
                  setWalletError("MetaMask connection rejected.");
                }
              }}
            >
              <img src={detectedWallet.icon} alt="MetaMask" className="w-6 h-6" />
              MetaMask
            </button>
          )}

          {/* Additional wallets */}
          <button
            className="bg-secondary2 text-white px-4 py-2 rounded font-medium hover:bg-opacity-80 flex items-center justify-center gap-2"
            type="button"
            onClick={() => setWalletError("WalletConnect integration coming soon.")}
          >
            <img src="/assets/WalletConnect.svg" alt="WalletConnect" className="w-6 h-6" />
            WalletConnect
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
        <>
          <button
            className="text-xs text-primary2 underline mb-2"
            onClick={() => setConnectionMethod(null)}
            type="button"
          >
            &larr; Back
          </button>

          {/* Username viewer bar */}
          <div className="mb-4 flex items-center justify-between px-4 py-2 rounded">
            <span className="text-sm font-bold text-white">
              {token ? username : "login"}
            </span>
          </div>

          {/* Auth Forms */}
          {!token && (
            <div className="space-y-3">
              {!isSignup ? (
                // --- Login Form ---
                <>
                  <div>
                    <input
                      className={`w-full px-4 py-2 rounded bg-backgrounddark text-white border border-transparent hover:border-secondary1 focus:outline-none focus:border-secondary1 transition-colors ${usernameTouched && !validateUsername(username)
                        ? "border-warningcolor"
                        : "border-transparent"
                        }`}
                      placeholder="Username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameTouched(true);
                        setLoginError("");
                      }}
                      onBlur={() => setUsernameTouched(true)}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <input
                      className={`w-full px-4 py-2 rounded bg-backgrounddark text-white  border border-transparent hover:border-secondary1 focus:outline-none focus:border-secondary1 transition-colors ${passwordTouched && !validatePassword(password)
                        ? "border-warningcolor"
                        : "border-transparent"
                        }`}
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordTouched(true);
                        setLoginError("");
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {loginError && (
                    <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-2">
                      {loginError}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={handleLogin}
                      className="bg-primary2 text-black px-4 py-2 rounded font-medium hover:bg-opacity-80"
                      type="button"
                    >
                      Log in
                    </button>
                    <span
                      className="text-primary2 text-sm cursor-pointer hover:underline"
                      onClick={() => {
                        setIsSignup(true);
                        setSignupError("");
                        setUsernameTouched(false);
                        setPasswordTouched(false);
                        setRepeatPasswordTouched(false);
                        setUsername("");
                        setPassword("");
                        setRepeatPassword("");
                      }}
                    >
                      Sign up
                    </span>
                  </div>
                </>
              ) : (
                // --- Signup Form ---
                <div className="p-4 rounded space-y-2">
                  <div>
                    <label className="block text-xs mb-1">Username</label>
                    <input
                      className={`w-full px-3 py-2 rounded bg-backgrounddark text-white border border-transparent hover:border-secondary1 focus:outline-none focus:border-secondary1 transition-colors ${usernameTouched && !validateUsername(username)
                        ? "border-warningcolor"
                        : "border-transparent"
                        }`}
                      placeholder="Username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameTouched(true);
                        setSignupError("");
                      }}
                      onBlur={() => setUsernameTouched(true)}
                      autoComplete="off"
                      required
                    />
                    {usernameTouched && !validateUsername(username) && (
                      <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-1">
                        Username must be at least 4 letters.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Password</label>
                    <input
                      className={`w-full px-3 py-2 rounded bg-backgrounddark text-white border border-transparent hover:border-secondary1 focus:outline-none focus:border-secondary1 transition-colors ${passwordTouched && !validatePassword(password)
                        ? "border-warningcolor"
                        : "border-transparent"
                        }`}
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordTouched(true);
                        setSignupError("");
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      autoComplete="new-password"
                      required
                    />
                    {passwordTouched && !validatePassword(password) && (
                      <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-1">
                        Password must have 1 uppercase letter, 1 number and 1 special character.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Repeat Password</label>
                    <input
                      className={`w-full px-3 py-2 rounded bg-backgrounddark text-white border border-transparent hover:border-secondary1 focus:outline-none focus:border-secondary1 transition-colors ${repeatPasswordTouched && password !== repeatPassword
                        ? "border-warningcolor"
                        : "border-transparent"
                        }`}
                      placeholder="Repeat Password"
                      type="password"
                      value={repeatPassword}
                      onChange={(e) => {
                        setRepeatPassword(e.target.value);
                        setRepeatPasswordTouched(true);
                        setSignupError("");
                      }}
                      onBlur={() => setRepeatPasswordTouched(true)}
                      autoComplete="new-password"
                      required
                    />
                    {repeatPasswordTouched && password !== repeatPassword && (
                      <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-1">
                        Passwords do not match.
                      </div>
                    )}
                  </div>
                  {signupError && (
                    <div className="bg-warningcolor text-white text-xs rounded px-2 py-1 mt-2">
                      {signupError}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={createUser}
                      className="bg-primary2 text-black px-4 py-2 rounded font-medium hover:bg-opacity-80"
                      type="button"
                    >
                      Sign up
                    </button>
                    <span
                      className="text-primary2 text-sm cursor-pointer hover:underline"
                      onClick={() => {
                        setIsSignup(false);
                        setLoginError("");
                        setUsernameTouched(false);
                        setPasswordTouched(false);
                        setRepeatPasswordTouched(false);
                        setUsername("");
                        setPassword("");
                        setRepeatPassword("");
                      }}
                    >
                      Log in
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password change section (only after login) */}
          {token && (
            <>
              {/* Logout button outside password panel */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={logoutUser}
                  className="bg-warningcolor px-4 py-2 rounded font-medium hover:bg-opacity-80"
                  type="button"
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {/* Response messages */}
          {responseData && (
            <div className="text-sm mt-2 text-white">
              {responseData.msg && <div>{responseData.msg}</div>}
              {responseData.detail && (
                <pre className="bg-black/40 p-2 rounded mt-2 text-xs overflow-x-auto">
                  {typeof responseData.detail === "string"
                    ? responseData.detail
                    : JSON.stringify(responseData.detail, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* User ID after signup */}
          {userId && <div className="text-sm mt-1 text-green-400"><strong>User ID:</strong> {userId}</div>}
        </>
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
          {signature && (
            <div className="text-green-400">
              Terms accepted and signed!<br />
              <span className="break-all text-xs">{signature}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuthPanel;