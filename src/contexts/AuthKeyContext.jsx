import { createContext, useContext, useState, useEffect } from "react";

export const AuthKeyContext = createContext();

export function AuthKeyProvider({ children }) {
  // Initialize from localStorage if available
  const [authKey, setAuthKey] = useState(() => localStorage.getItem("authKey") || null);

  // Save authKey to localStorage whenever it changes
  useEffect(() => {
    if (authKey) {
      localStorage.setItem("authKey", authKey);
    } else {
      localStorage.removeItem("authKey");
    }
  }, [authKey]);

  return (
    <AuthKeyContext.Provider value={{ authKey, setAuthKey }}>
      {children}
    </AuthKeyContext.Provider>
  );
}

export function useAuthKey() {
  return useContext(AuthKeyContext);
}