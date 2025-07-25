import { create } from "zustand";

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

// --- Sync Zustand store with localStorage across tabs ---
const STORAGE_KEY = "zustand-store-state";

// Save to localStorage on every change
useZustandStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

// Listen for changes from other tabs
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    const newState = JSON.parse(event.newValue);
    // Only update the data, not the functions
    const currentState = useZustandStore.getState();
    // Remove all function keys from currentState
    const mergedState = { ...currentState };
    Object.keys(newState).forEach((key) => {
      if (typeof newState[key] !== "function") {
        mergedState[key] = newState[key];
      }
    });
    useZustandStore.setState(mergedState, false);
  }
});

export { useZustandStore, marketsData };
