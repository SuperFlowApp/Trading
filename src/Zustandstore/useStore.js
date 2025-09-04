import { create } from "zustand";

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const savedState = localStorage.getItem("zustand-store-state");
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
  }
  return {};
};

const initialState = loadInitialState();

const useZustandStore = create((set, get) => ({
  // price midpoint settings
  priceMidpoint: initialState.priceMidpoint || "0.0",
  setPriceMidpoint: (value) => set({ priceMidpoint: value }),

  // selected price settings
  OrderBookClickedPrice: initialState.OrderBookClickedPrice || null,
  setOrderBookClickedPrice: (value) => set({ OrderBookClickedPrice: value }),

  // selected price settings
  selectedCurrency: initialState.selectedCurrency || null,
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  // Notional settings
  currentNotional: initialState.currentNotional || null,
  setNotional: (Notional) => set({ currentNotional: Notional }),

  // Available USDT balance (for NotificationBar and others)
  availableUsdt: typeof initialState.availableUsdt === "number" ? initialState.availableUsdt : 0,
  setAvailableUsdt: (value) => set({ availableUsdt: Number(value) || 0 }),

  red: initialState.red || "#F59DEF",
  green: initialState.green || "#00B7C9",
  setRed: (value) => set({ red: value }),
  setGreen: (value) => set({ green: value }),

  chartSettings: initialState.chartSettings || {
    grid_show: true,
    reverse_coordinate: false,
    price_axis_type: 'normal',
    last_price_show: true,
    high_price_show: false,
    low_price_show: false,
    indicator_last_value_show: true,
    fontSize: 'medium', // small | medium | large
    watermark_show: true, // ← add this line
  },
  setChartSettings: (settings) => set({ chartSettings: { ...get().chartSettings, ...settings } }),

  accountInfo: initialState.accountInfo || null,
  setAccountInfo: (info) => set({ accountInfo: info }),
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
