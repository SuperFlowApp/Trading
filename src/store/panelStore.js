import { create } from "zustand";

const usePanelStore = create((set) => ({
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
}));

console.log("Zustand panelStore state:", usePanelStore.getState());

export default usePanelStore;
