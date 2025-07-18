import React from 'react';
import './HomePage.css';

const HomePage = () => {
  // Function to handle navigation to different pages
  const handleNavigation = (page) => {
    window.dispatchEvent(
      new CustomEvent('navigationChange', { detail: { page } })
    );
  };

  return (
    <div className="home-page page-container">
      <header className="home-header">
        <h1 className="home-title">Welcome to AudioChat</h1>
        <p className="home-subtitle">Your AI-powered audio engineering assistant</p>
      </header>
      <p className="home-description">
        Choose one of the options below to get started.
      </p>
      <div className="quick-links">
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('chats')}
        >
          Open Chats
        </button>
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('audio')}
        >
          Audio Processing
        </button>
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('settings')}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

export default HomePage;