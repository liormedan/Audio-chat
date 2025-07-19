import React, { useEffect, useState } from 'react';
import { FaComments, FaMusic, FaCog, FaChevronRight } from 'react-icons/fa';
import './HomePage.css';

// Helper function to safely parse JSON
const loadRecentChats = () => {
  const savedChats = localStorage.getItem('audioChat_recentChats');
  if (!savedChats) return [];

  try {
    const chats = JSON.parse(savedChats);
    return Array.isArray(chats) ? chats.slice(0, 5) : [];
  } catch (error) {
    console.error('Error parsing recent chats:', error);
    return [];
  }
};

const HomePage = () => {
  const [recentChats, setRecentChats] = useState([]);

  // Load recent chats from localStorage on mount
  useEffect(() => {
    setRecentChats(loadRecentChats());
  }, []);

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

      <div className="quick-links">
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('chats')}
        >
          <FaComments className="quick-link-icon" />
          Open Chats
        </button>
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('audio')}
        >
          <FaMusic className="quick-link-icon" />
          Audio Processing
        </button>
        <button
          className="quick-link-button"
          onClick={() => handleNavigation('settings')}
        >
          <FaCog className="quick-link-icon" />
          Settings
        </button>
      </div>

      {recentChats.length > 0 && (
        <div className="recent-chats">
          <h3 className="recent-chats-title">Recent Chats</h3>
          <ul className="recent-chat-list">
            {recentChats.map((chat) => (
              <li
                key={chat.id}
                className="recent-chat-item"
                onClick={() => handleNavigation('chats')}
              >
                <div className="recent-chat-info">
                  <span className="recent-chat-name">{chat.title}</span>
                  <span className="recent-chat-date">{chat.date}</span>
                </div>
                <FaChevronRight className="recent-chat-icon" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePage;