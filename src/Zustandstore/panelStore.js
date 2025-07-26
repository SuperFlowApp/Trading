import { create } from "zustand";

const useAuthKeyStore = create((set) => ({
  authKey: null,
  setauthKey: (authKey) => set({ authKey }),
}));


const marketsData = create((set) => ({
  allMarketData: [],
  setAllMarketData: (markets) => set({ allMarketData: markets }),
}));

const useZustandStore = create((set, get) => ({
  // Leverage settings
  leverage: 5,
  isLeveragePanelOpen: false,
  setLeverage: (leverage) => set({ leverage }),
  setLeveragePanelOpen: (open) => set({ isLeveragePanelOpen: open }),

  // Margin mode settings
  marginMode: "Cross",
  isMarginModePanelOpen: false,
  setMarginMode: (mode) => set({ marginMode: mode }),
  setMarginModePanelOpen: (open) => set({ isMarginModePanelOpen: open }),

  // Position mode settings
  isPositionModePanelOpen: false,
  setPositionModePanelOpen: (open) => set({ isPositionModePanelOpen: open }),

  // active tab settings
  activeTab: null,
  setActiveTab: (tab) => set({ activeTab: tab }),

  // price midpoint settings
  priceMidpoint: null,
  setPriceMidpoint: (value) => set({ priceMidpoint: value }),

  // selected price settings
  OrderBookClickedPrice: null,
  setOrderBookClickedPrice: (value) => set({ OrderBookClickedPrice: value }),

  // selected price settings
  selectedCurrency: null,
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  // login panel settings
  showLoginPanel: false,
  setShowLoginPanel: (show) => set({ showLoginPanel: show }),
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
syncZustandStore(marketsData, "markets-data-state");
syncZustandStore(useAuthKeyStore, "auth-key-state");

export { useZustandStore, marketsData, useAuthKeyStore };
