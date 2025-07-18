import { create } from 'zustand';

const usePanelStore = create((set) => ({
  // Example states
  activeTab: null,
  priceMidpoint: null,
  selectedPrice: null,
  selectedCurrency: null,
  showLoginPanel: false,
  selectedPair: null,
  // Add more states as needed...

  // Example actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPriceMidpoint: (value) => set({ priceMidpoint: value }),
  setSelectedPrice: (value) => set({ selectedPrice: value }),
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
  setShowLoginPanel: (show) => set({ showLoginPanel: show }),
  setSelectedPair: (pair) => set({ selectedPair: pair }),
  // Add more actions as needed...
}));

// Log the current Zustand state to the console
console.log('Zustand panelStore state:', usePanelStore.getState());

export default usePanelStore;