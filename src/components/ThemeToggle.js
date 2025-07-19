import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <FaSun aria-label="Light mode" className="theme-toggle-icon" />
      ) : (
        <FaMoon aria-label="Dark mode" className="theme-toggle-icon" />
      )}
      <span className="theme-toggle-text">
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;