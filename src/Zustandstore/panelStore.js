import { create } from "zustand";

const DEFAULT_NOTIFICATION = {
  type: "info",
  message: "Welcome to SuperFlow Trading app!",
};

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

  // Order Form State
  OrderFormState: { ...DEFAULT_ORDER_FORM_STATE },
  setOrderFormState: (updates) => {
    set((state) => {
      const newState = { ...state.OrderFormState, ...updates };
      // Print whenever OrderFormState is updated
      console.log("OrderFormState updated:", newState);
      return { OrderFormState: newState };
    });
  },
}));

export default useZustandStore;
