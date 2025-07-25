import { create } from "zustand";

const DEFAULT_NOTIFICATION = {
  type: "info",
  message: "Welcome to SuperFlow Trading app!",
};

const notificationStore = create((set) => ({
  // notification settings
  notification: DEFAULT_NOTIFICATION,
  setNotification: (notification) => set({ notification }),
  clearNotification: () => set({ notification: DEFAULT_NOTIFICATION }),
}));






// --- Sync Zustand store with localStorage across tabs ---
const STORAGE_KEY = "notification-store-state";

// Save to localStorage on every change
notificationStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

// Listen for changes from other tabs
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    const newState = JSON.parse(event.newValue);
    // Only update the data, not the functions
    const currentState = notificationStore.getState();
    // Remove all function keys from currentState
    const mergedState = { ...currentState };
    Object.keys(newState).forEach((key) => {
      if (typeof newState[key] !== "function") {
        mergedState[key] = newState[key];
      }
    });
    notificationStore.setState(mergedState, false);
  }
});
export default notificationStore;
