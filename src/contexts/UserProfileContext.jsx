import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, createUserProfile, saveUserSettings, getUserSettings } from '../services/firestore';
import { useZustandStore } from "../Zustandstore/useStore";

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get Zustand store functions
  const red = useZustandStore((s) => s.red);
  const green = useZustandStore((s) => s.green);
  const setRed = useZustandStore((s) => s.setRed);
  const setGreen = useZustandStore((s) => s.setGreen);
  const chartSettings = useZustandStore(s => s.chartSettings);
  const setChartSettings = useZustandStore(s => s.setChartSettings);
  
  // Load user profile from local storage on initial render
  useEffect(() => {
    const loadSavedUser = async () => {
      const savedUsername = localStorage.getItem('username');
      
      if (savedUsername) {
        try {
          const userProfile = await getUserProfile(savedUsername);
          
          if (userProfile) {
            setCurrentUser(userProfile);
            
            // Apply saved settings from Firebase to Zustand store
            if (userProfile.settings) {
              // Apply color settings
              if (userProfile.settings.red) {
                setRed(userProfile.settings.red);
                document.documentElement.style.setProperty("--color-red", userProfile.settings.red);
              }
              
              if (userProfile.settings.green) {
                setGreen(userProfile.settings.green);
                document.documentElement.style.setProperty("--color-green", userProfile.settings.green);
              }
              
              // Apply chart settings
              if (userProfile.settings.chartSettings) {
                setChartSettings(userProfile.settings.chartSettings);
              }
            }
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadSavedUser();
  }, []);
  
  // Save settings to Firebase when they change
  useEffect(() => {
    const saveSettings = async () => {
      if (currentUser?.username) {
        const settingsToSave = {
          red,
          green,
          chartSettings
        };
        
        try {
          await saveUserSettings(currentUser.username, settingsToSave);
        } catch (error) {
          console.error("Error saving settings:", error);
        }
      }
    };
    
    // Only save if user is logged in and not in initial loading state
    if (currentUser && !isLoading) {
      saveSettings();
    }
  }, [red, green, chartSettings, currentUser]);
  
  // Login function
  const login = async (username) => {
    try {
      setIsLoading(true);
      
      // Get or create user profile
      let userProfile = await getUserProfile(username);
      
      if (!userProfile) {
        // Create new user with current settings
        userProfile = await createUserProfile(username, {
          settings: {
            red,
            green,
            chartSettings
          }
        });
      } else {
        // Apply saved settings
        if (userProfile.settings) {
          if (userProfile.settings.red) {
            setRed(userProfile.settings.red);
            document.documentElement.style.setProperty("--color-red", userProfile.settings.red);
          }
          
          if (userProfile.settings.green) {
            setGreen(userProfile.settings.green);
            document.documentElement.style.setProperty("--color-green", userProfile.settings.green);
          }
          
          if (userProfile.settings.chartSettings) {
            setChartSettings(userProfile.settings.chartSettings);
          }
        }
      }
      
      setCurrentUser(userProfile);
      localStorage.setItem('username', username);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('username');
  };
  
  const value = {
    currentUser,
    isLoading,
    login,
    logout
  };
  
  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}