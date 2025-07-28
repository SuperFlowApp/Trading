import { create } from "zustand";

// New: OrderFormState initial structure
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

const useUserInputStore = create((set) => ({
  selectedPair: "BTC",
  setSelectedPair: (pair) => set({ selectedPair: pair }),

  // Order Form State
  OrderFormState: { ...DEFAULT_ORDER_FORM_STATE },
  setOrderFormState: (updates) => {
    set((state) => {
      const newState = { ...state.OrderFormState, ...updates };
      return { OrderFormState: newState };
    });
  },
}));

// --- Sync Zustand store with localStorage across tabs ---
const STORAGE_KEY = "userinput-store-state";

// Save to localStorage on every change
useUserInputStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

// Listen for changes from other tabs
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    const newState = JSON.parse(event.newValue);
    // Only update the data, not the functions
    const currentState = useUserInputStore.getState();
    // Remove all function keys from currentState
    const mergedState = { ...currentState };
    Object.keys(newState).forEach((key) => {
      if (typeof newState[key] !== "function") {
        mergedState[key] = newState[key];
      }
    });
    useUserInputStore.setState(mergedState, false);
  }
});
export default useUserInputStore;
