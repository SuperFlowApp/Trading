import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken") || "");
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const [accountInfo, setAccountInfo] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(null);

  // Fetch account information function
  const fetchAccountInfo = async () => {
    if (!token) {
      setAccountInfo(null);
      setAvailableBalance(null);
      return;
    }
    try {
      const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information-direct', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        logout();
        setAccountInfo(null);
        setAvailableBalance(null);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch account information');
      }
      const data = await response.json();
      setAccountInfo(data);
      // Extract availableBalance specifically
      setAvailableBalance(data.availableBalance || null);
    } catch (err) {
      console.error('Failed to fetch account information:', err);
      setAccountInfo(null);
      setAvailableBalance(null);
    }
  };

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
    setAccountInfo(null);
    setAvailableBalance(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
  };

  // Validate token on mount
  React.useEffect(() => {
    if (!token) {
      setLoading(false); // No token, done loading
      console.log("Unauthorized");
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
        // No need to parse JSON if you don't use it
        console.log("Authorized");
      })
      .catch(() => {
        logout();
        console.log("Unauthorized");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Fetch account info when token is available
  React.useEffect(() => {
    if (token) {
      fetchAccountInfo();
      // Set up interval to fetch account info every 5 seconds
      const interval = setInterval(fetchAccountInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      login, 
      logout, 
      accountInfo, 
      availableBalance, 
      fetchAccountInfo,
      loading
    }}>
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