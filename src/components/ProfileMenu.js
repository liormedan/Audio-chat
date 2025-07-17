import React, { useState, useRef, useEffect } from 'react';
import './ProfileMenu.css';

function ProfileMenu({ onOpenPage = () => {}, onLogout = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="profile-menu" ref={dropdownRef}>
      <button 
        className="profile-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile and settings"
      >
        <div className="profile-avatar">
          <span>U</span>
        </div>
        <div className="profile-status-indicator"></div>
      </button>
      
      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-info">
              <div className="profile-name">
                User
                <span className="premium-badge">Plus</span>
              </div>
              <div className="profile-email">user@example.com</div>
            </div>
          </div>
          
          <div className="menu-items">
            <button 
              className="menu-item"
              onClick={() => {
                onOpenPage('settings');
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">⚙️</span>
              Settings
            </button>
            <button 
              className="menu-item"
              onClick={() => {
                onOpenPage('appearance');
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">🎨</span>
              Appearance
            </button>
            <button 
              className="menu-item"
              onClick={() => {
                onOpenPage('database');
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">🗄️</span>
              Database
            </button>
            <button 
              className="menu-item"
              onClick={() => {
                onOpenPage('api-keys');
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">🔑</span>
              API Keys
            </button>
            <button 
              className="menu-item"
              onClick={() => {
                onOpenPage('help-faq');
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">❓</span>
              Help & FAQ
            </button>
          </div>
          
          <div className="menu-footer">
            <button 
              className="menu-item logout"
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
            >
              <span className="menu-icon">🚪</span>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;