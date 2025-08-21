import { useState, useEffect } from 'react';
import { useAuthKey } from '../contexts/AuthKeyContext';
import { getUserSettings, saveUserSettings } from '../services/firestore';
import { useZustandStore } from '../Zustandstore/useStore';

export function useUserSettings() {
  const { username } = useAuthKey();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get all settings from Zustand store
  const red = useZustandStore(s => s.red);
  const green = useZustandStore(s => s.green);
  const chartSettings = useZustandStore(s => s.chartSettings);
  
  // Store setters
  const setRed = useZustandStore(s => s.setRed);
  const setGreen = useZustandStore(s => s.setGreen);
  const setChartSettings = useZustandStore(s => s.setChartSettings);
  
  // Load settings when username changes (user logs in)
  useEffect(() => {
    if (!username) return;
    
    async function loadSettings() {
      setIsLoading(true);
      setError(null);
      try {
        const settings = await getUserSettings(username);
        if (settings) {
          // Apply loaded settings to the store
          if (settings.colors) {
            setRed(settings.colors.red);
            setGreen(settings.colors.green);
            // Apply CSS variables
            document.documentElement.style.setProperty("--color-red", settings.colors.red);
            document.documentElement.style.setProperty("--color-green", settings.colors.green);
          }
          
          if (settings.chartSettings) {
            setChartSettings(settings.chartSettings);
          }
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, [username, setRed, setGreen, setChartSettings]);
  
  // Save settings function
  const saveSettings = async () => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const settings = {
        colors: { red, green },
        chartSettings,
        lastUpdated: new Date().toISOString()
      };
      
      await saveUserSettings(username, settings);
    } catch (err) {
      console.error('Error saving user settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { saveSettings, isLoading, error };
}