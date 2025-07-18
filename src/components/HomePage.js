import React, { useEffect } from 'react';
import './HomePage.css';

const HomePage = () => {
  // Function to handle navigation to different pages
  const handleNavigation = (page) => {
    console.log('HomePage: Navigating to', page); // Debug log
    // Dispatch a custom event to notify App.js about the navigation
    window.dispatchEvent(new CustomEvent('navigationChange', { detail: { page } }));
  };

  // Automatically navigate to chats page when component mounts
  useEffect(() => {
    // Navigate immediately
    handleNavigation('chats');
    
    // If that doesn't work, try again after a short delay
    const timer = setTimeout(() => {
      handleNavigation('chats');
    }, 100);
    
    // And try one more time after a longer delay
    const timer2 = setTimeout(() => {
      handleNavigation('chats');
    }, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Welcome to AudioChat</h1>
        <p className="home-subtitle">Your AI-powered audio engineering assistant</p>
        <p className="redirecting-message">Redirecting to chat interface...</p>
      </header>
      
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default HomePage;