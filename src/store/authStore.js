import { create } from "zustand";

// Check localStorage for the saved login state
const savedLoginState = localStorage.getItem("isLoggedIn") === "true";

const useAuthStore = create((set) => ({
  isLoggedIn: savedLoginState, // Initialize with the saved state
  setLoginState: (state) => {
    // Persist the state in localStorage
    localStorage.setItem("isLoggedIn", state);
    set({ isLoggedIn: state });
  },
}));

export default useAuthStore;