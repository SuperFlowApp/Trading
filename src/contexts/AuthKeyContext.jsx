import { createContext, useContext, useState } from "react";

export const AuthKeyContext = createContext();

export function AuthKeyProvider({ children }) {
  const [authKey, setAuthKey] = useState(null); // Default value

  return (
    <AuthKeyContext.Provider value={{ authKey, setAuthKey }}>
      {children}
    </AuthKeyContext.Provider>
  );
}

export function useAuthKey() {
  return useContext(AuthKeyContext);
}