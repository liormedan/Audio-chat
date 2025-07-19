import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
  // Check if dark mode is stored in localStorage, default to true (dark mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('audiochat-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Apply theme when it changes
  useEffect(() => {
    // Update document class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('audiochat-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Set specific theme
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };

  // Value to be provided by the context
  const contextValue = {
    isDarkMode,
    toggleTheme,
    setTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;