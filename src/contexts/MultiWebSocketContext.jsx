import { createContext, useContext, useEffect } from "react";
import { useMultiWebSocket } from "../hooks/useMultiWebSocket";
import { selectedPairStore } from "../Zustandstore/userOrderStore";

const MultiWebSocketContext = createContext(null);

export function MultiWebSocketProvider({ children }) {
  // Get the selected pair from the store
  const selectedPair = selectedPairStore((state) => state.selectedPair);
  const symbol = `${selectedPair}USDT`; // Convert to full symbol format

  // Pass the current symbol to the WebSocket hook
  const wsState = useMultiWebSocket({
    symbol: symbol,
  });

  // Update the symbol in the WebSocket hook when selectedPair changes
  useEffect(() => {
    wsState.setSymbol(symbol);
  }, [selectedPair, wsState]);

  return (
    <MultiWebSocketContext.Provider value={wsState}>
      {children}
    </MultiWebSocketContext.Provider>
  );
}

export function useMultiWebSocketGlobal() {
  return useContext(MultiWebSocketContext);
}