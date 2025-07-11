import { useState } from "react";
import { useAuth } from "../context/Authentication";

function validateUsername(username) {
    return typeof username === "string" && username.length >= 4;
}
function validatePassword(password) {
    return (
        typeof password === "string" &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}

export default function EmailLoginPanel({
    onBack,
    onLoginSuccess,
    responseData,
    setResponseData,
    userId,
    setUserId,
    isSignup,
    setIsSignup,
}) {
    const { token, login, logout } = useAuth();

    // Local states
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [repeatPasswordTouched, setRepeatPasswordTouched] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [signupError, setSignupError] = useState("");

    // Signup function: create user on server
    const signup = async (username, password) => {
        try {
            const res = await fetch(
                `https://fastify-serverless-function-rimj.onrender.com/api/create_user?username=${encodeURIComponent(
                    username
                )}&password=${encodeURIComponent(password)}`,
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
                localStorage.setItem("username", username);
                setResponseData({ msg: "Logged in successfully", detail: username });
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
        localStorage.removeItem("username");
    };

    return (
        <>
            <button
                className="text-l absolute top-2 left-4 font-light text-white hover:text-primary2 focus:outline-none"

                onClick={onBack}
                type="button"
            >
                &larr; Back
            </button>

            {!token && (
                <div className="space-y-3">
                    {!isSignup ? (
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
                            <div className="w-full flex items-center gap-6 pt-8">
                                <button
                                    onClick={handleLogin}
                                    className="bg-primary2 text-black px-4 py-2 rounded font-medium hover:bg-opacity-80"
                                    type="button"
                                >
                                    Log in
                                </button>
                                <span
                                    className="text-white text-m cursor-pointer hover:underline"
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
                        <div className=" rounded space-y-2">
                            <div>
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
                            <div className="flex items-center gap-8 pt-12">
                                <button
                                    onClick={createUser}
                                    className="bg-primary2 text-black px-4 py-2 rounded font-medium hover:bg-opacity-80"
                                    type="button"
                                >
                                    Sign up
                                </button>
                                <span
                                    className="text-white cursor-pointer hover:underline"
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
            {token && (
                <div className="mt-4 flex gap-2 items-center">
                    <span className="text-white bg-primary2 px-4 py-2 rounded font-medium">
                        {localStorage.getItem("username") || "User"}
                    </span>
                    <button
                        onClick={logoutUser}
                        className="bg-warningcolor px-4 py-2 rounded font-medium hover:bg-opacity-80"
                        type="button"
                    >
                        Logout
                    </button>
                </div>
            )}
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
            {userId && (
                <div className="text-sm mt-1 text-green-400">
                    <strong>User ID:</strong> {userId}
                </div>
            )}
        </>
    );
}