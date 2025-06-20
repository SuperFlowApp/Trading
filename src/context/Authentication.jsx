import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken") || "");
  const [loading, setLoading] = useState(true); // <-- Add loading state

  // Validate token on mount
  React.useEffect(() => {
    if (!token) {
      setLoading(false); // No token, done loading
      return;
    }
    // Try to fetch balance or a protected endpoint to check token validity
    fetch("https://fastify-serverless-function-rimj.onrender.com/api/balance", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token or server down");
        return res.json();
      })
      .catch(() => {
        setToken("");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("username"); // <-- Also clear username
      })
      .finally(() => setLoading(false)); // <-- Set loading to false after check
  }, [token]);

  // Login function: fetch token from server
  const login = async (username, password) => {
    const res = await fetch(
      `https://fastify-serverless-function-rimj.onrender.com/api/token?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("accessToken", data.access_token);

      // Fetch and print balance after login
      try {
        const balanceRes = await fetch(
          "https://fastify-serverless-function-rimj.onrender.com/api/balance",
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${data.access_token}`,
            },
          }
        );
        const balanceData = await balanceRes.json();
        //console.log("User Balance:", balanceData);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }

      return { success: true, token: data.access_token };
    } else {
      setToken("");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
      return { success: false, error: data.error || "No token received" };
    }
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
  };

  // Print the token in the console as long as we are logged in
  React.useEffect(() => {
    if (token) {
      console.log("Access Token:", token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper for authenticated fetch
export function useAuthFetch() {
  const { token } = useAuth();
  return async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
  };
}