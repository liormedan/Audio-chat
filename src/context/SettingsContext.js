import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const SettingsContext = createContext();

// Settings provider component
export function SettingsProvider({ children }) {
  // Initialize state with default values or values from localStorage
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('audioChat_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      theme: 'dark',
      fontSize: 16,
      messageDensity: 'normal',
      codeSyntaxHighlighting: true,
      codeLineNumbers: true,
      autoPlayAudio: true,
      selectedVoice: 'default',
      userProfile: {
        displayName: '',
        email: ''
      }
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audioChat_settings', JSON.stringify(settings));
  }, [settings]);

  // Function to update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Function to reset all settings to default
  const resetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      fontSize: 16,
      messageDensity: 'normal',
      codeSyntaxHighlighting: true,
      codeLineNumbers: true,
      autoPlayAudio: true,
      selectedVoice: 'default',
      userProfile: {
        displayName: '',
        email: ''
      }
    };
    setSettings(defaultSettings);
  };

  // Value to be provided by the context
  const contextValue = {
    settings,
    updateSetting,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;