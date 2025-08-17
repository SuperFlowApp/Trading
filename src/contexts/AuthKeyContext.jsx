import { createContext, useContext, useState, useEffect } from "react";

export const AuthKeyContext = createContext();

export function AuthKeyProvider({ children }) {
  // Initialize from localStorage if available
  const [authKey, setAuthKey] = useState(() => localStorage.getItem("authKey") || null);
  const [username, setUsername] = useState(() => localStorage.getItem("username") || null);

  // Save authKey to localStorage whenever it changes
  useEffect(() => {
    if (authKey) {
      localStorage.setItem("authKey", authKey);
    } else {
      localStorage.removeItem("authKey");
    }
  }, [authKey]);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
  }, [username]);

  return (
    <AuthKeyContext.Provider value={{ authKey, setAuthKey, username, setUsername }}>
      {children}
    </AuthKeyContext.Provider>
  );
}

export function useAuthKey() {
  return useContext(AuthKeyContext);
}