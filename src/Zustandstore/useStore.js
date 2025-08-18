import { create } from "zustand";

const useZustandStore = create((set, get) => ({
  // price midpoint settings
  priceMidpoint: "0.0",
  setPriceMidpoint: (value) => set({ priceMidpoint: value }),

  // selected price settings
  OrderBookClickedPrice: null,
  setOrderBookClickedPrice: (value) => set({ OrderBookClickedPrice: value }),

  // selected price settings
  selectedCurrency: null,
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  // Notional settings
  currentNotional: null,
  setNotional: (Notional) => set({ currentNotional: Notional }),

  red: "#F59DEF",
  green: "#00B7C9",
  setRed: (value) => set({ red: value }),
  setGreen: (value) => set({ green: value }),
}));

// --- Sync Zustand stores with localStorage across tabs ---
function syncZustandStore(store, storageKey) {
  // Save to localStorage on every change
  store.subscribe((state) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  });

  // Listen for changes from other tabs
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey && event.newValue) {
      const newState = JSON.parse(event.newValue);
      // Only update the data, not the functions
      const currentState = store.getState();
      const mergedState = { ...currentState };
      Object.keys(newState).forEach((key) => {
        if (typeof newState[key] !== "function") {
          mergedState[key] = newState[key];
        }
      });
      store.setState(mergedState, false);
    }
  });
}

// Apply syncing to all stores
syncZustandStore(useZustandStore, "zustand-store-state");

export { useZustandStore };
