import { createContext, useContext } from "react";
import { useMultiWebSocket } from "../hooks/useMultiWebSocket";

const MultiWebSocketContext = createContext(null);

export function MultiWebSocketProvider({ children }) {
  const wsState = useMultiWebSocket({});
  return (
    <MultiWebSocketContext.Provider value={wsState}>
      {children}
    </MultiWebSocketContext.Provider>
  );
}

export function useMultiWebSocketGlobal() {
  return useContext(MultiWebSocketContext);
}