import { create } from "zustand";

const DEFAULT_NOTIFICATION = {
  type: "info",
  message: "Welcome to SuperFlow Trading app!",
};

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
  selectedPrice: null,
  setSelectedPrice: (value) => set({ selectedPrice: value }),

  // selected price settings
  selectedCurrency: null,
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  // login panel settings
  showLoginPanel: false,
  setShowLoginPanel: (show) => set({ showLoginPanel: show }),

  // selected pair settings
  selectedPair: 'BTC',
  setSelectedPair: (pair) => set({ selectedPair: pair }),

  // notification settings
  notification: DEFAULT_NOTIFICATION,
  setNotification: (notification) => set({ notification }),
  clearNotification: () => set({ notification: DEFAULT_NOTIFICATION }),

  // All market data storage
  allMarketData: [],
  setAllMarketData: (markets) => set({ allMarketData: markets }),
}));

console.log("Zustand panelStore state:", useZustandStore.getState());

export default useZustandStore;
