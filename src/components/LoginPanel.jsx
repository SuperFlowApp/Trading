import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authentication"; // <-- use AuthContext

// Credential validation helpers
const validateUsername = (username) => username.length >= 4;
const validatePassword = (password) =>
  /[A-Z]/.test(password) && // at least one uppercase letter
  /[0-9]/.test(password) && // at least one number
  /[^A-Za-z0-9]/.test(password); // at least one special character

function AuthPanel({ onLoginSuccess }) {
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
  const { token, login, logout, signup } = useAuth();

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

  // --- UI ---
  return (
    <div className="bg-[#0D2221] text-white p-6 rounded-lg w-full max-w-md mx-auto space-y-4 border border-[#7DADB1]">
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
                <label className="block text-xs mb-1">Username</label>
                <input
                  className={`w-full px-4 py-2 rounded bg-[#1E4D4E] text-white border transition-colors ${usernameTouched && !validateUsername(username)
                    ? "border-red-500"
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
                <label className="block text-xs mb-1">Password</label>
                <input
                  className={`w-full px-4 py-2 rounded bg-[#1E4D4E] text-white border transition-colors ${passwordTouched && !validatePassword(password)
                    ? "border-red-500"
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
                <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-2">
                  {loginError}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleLogin}
                  className="bg-[#F5CB9D] text-black px-4 py-2 rounded font-medium hover:bg-opacity-80"
                  type="button"
                >
                  Log in
                </button>
                <span
                  className="text-[#2D9DA8] text-sm cursor-pointer hover:underline"
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
            <div className="p-4 bg-[#18393A] rounded space-y-2">
              <div>
                <label className="block text-xs mb-1">Username</label>
                <input
                  className={`w-full px-3 py-2 rounded bg-[#1E4D4E] text-white border transition-colors ${usernameTouched && !validateUsername(username)
                    ? "border-red-500"
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
                  <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-1">
                    Username must be at least 4 letters.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1">Password</label>
                <input
                  className={`w-full px-3 py-2 rounded bg-[#1E4D4E] text-white border transition-colors ${passwordTouched && !validatePassword(password)
                    ? "border-red-500"
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
                  <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-1">
                    Password must have 1 uppercase letter, 1 number and 1 special character.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1">Repeat Password</label>
                <input
                  className={`w-full px-3 py-2 rounded bg-[#1E4D4E] text-white border transition-colors ${repeatPasswordTouched && password !== repeatPassword
                    ? "border-red-500"
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
                  <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-1">
                    Passwords do not match.
                  </div>
                )}
              </div>
              {signupError && (
                <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-2">
                  {signupError}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={createUser}
                  className="bg-[#2D9DA8] px-4 py-2 rounded font-medium hover:bg-opacity-80"
                  type="button"
                >
                  Sign up
                </button>
                <span
                  className="text-[#F5CB9D] text-sm cursor-pointer hover:underline"
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
              className="bg-red-400 px-4 py-2 rounded font-medium hover:bg-opacity-80"
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

    </div>
  );
}

export default AuthPanel;