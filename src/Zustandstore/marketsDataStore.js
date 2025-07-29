import { create } from "zustand";


const marketsData = create((set) => ({
  allMarketData: [],
  setAllMarketData: (markets) => set({ allMarketData: markets }),
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
syncZustandStore(marketsData, "markets-data-state");

export { marketsData };
