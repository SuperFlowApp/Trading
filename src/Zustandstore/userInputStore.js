import { create } from "zustand";

// --- Order Form Store ---
const DEFAULT_ORDER_FORM_STATE = {
  symbol: "BTCUSDT",
  type: "LIMIT",
  side: "BUY",
  positionSide: "BOTH",
  quantity: 0,
  price: 0,
  timeInForce: "GTC",
  orderRespType: "ACK",
  params: {},
};

const orderFormStore = create((set) => ({
  OrderFormState: { ...DEFAULT_ORDER_FORM_STATE },
  setOrderFormState: (updates) => {
    set((state) => ({
      OrderFormState: { ...state.OrderFormState, ...updates },
    }));
  },
}));

// --- User Input Store (for selectedPair only) ---
const selectedPairStore = create((set) => ({
  selectedPair: "BTC",
  setSelectedPair: (pair) => set({ selectedPair: pair }),
}));

// --- Sync Zustand store with localStorage across tabs ---
const STORAGE_KEY = "userinput-store-state";

// Save to localStorage on every change
selectedPairStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

// Listen for changes from other tabs
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    const newState = JSON.parse(event.newValue);
    // Only update the data, not the functions
    const currentState = selectedPairStore.getState();
    const mergedState = { ...currentState };
    Object.keys(newState).forEach((key) => {
      if (typeof newState[key] !== "function") {
        mergedState[key] = newState[key];
      }
    });
    selectedPairStore.setState(mergedState, false);
  }
});

export { orderFormStore, selectedPairStore };