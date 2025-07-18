import React, { useState, useContext, useEffect } from 'react';
import Sidebar, { SidebarSection, SidebarNav, SidebarNavItem } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './MainLayout.css';

// Icons from react-icons
import {
  FaHome,
  FaComments,
  FaMusic,
  FaCog,
  FaPuzzlePiece,
  FaQuestionCircle,
  FaUser,
  FaSignOutAlt,
} from 'react-icons/fa';

const MainLayout = ({ children }) => {
  const { user, signOut } = useAuth();
  const [activeItem, setActiveItem] = useState('home');

  // This function would be passed from App.js in a real implementation
  // For now, we'll use window.location to navigate
  const handleNavItemClick = (item) => {
    setActiveItem(item);
    
    // In a real implementation, this would use React Router or a state management solution
    // For now, we'll just use URL parameters to simulate navigation
    const url = new URL(window.location.href);
    url.searchParams.set('page', item);
    window.history.pushState({}, '', url);
    
    // Dispatch a custom event to notify App.js about the navigation
    window.dispatchEvent(new CustomEvent('navigationChange', { detail: { page: item } }));
  };

  // Get the current URL to determine active page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam) {
      setActiveItem(pageParam);
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="main-layout">
      <Sidebar>
        <div className="sidebar-header">
          <h2 className="sidebar-title">AudioChat</h2>
        </div>
        
        <SidebarSection>
          <SidebarNav>
            <SidebarNavItem
              icon={<FaHome aria-label="Home" />}
              active={activeItem === 'home'}
              onClick={() => handleNavItemClick('home')}
            >
              Home
            </SidebarNavItem>
            <SidebarNavItem
              icon={<FaComments aria-label="Chats" />}
              active={activeItem === 'chats'}
              onClick={() => handleNavItemClick('chats')}
            >
              Chats
            </SidebarNavItem>
            <SidebarNavItem
              icon={<FaMusic aria-label="Audio" />}
              active={activeItem === 'audio'}
              onClick={() => handleNavItemClick('audio')}
            >
              Audio Processing
            </SidebarNavItem>
          </SidebarNav>
        </SidebarSection>
        
        <SidebarSection title="Tools">
          <SidebarNav>
            <SidebarNavItem
              icon={<FaPuzzlePiece aria-label="Extensions" />}
              active={activeItem === 'extensions'}
              onClick={() => handleNavItemClick('extensions')}
            >
              Extensions
            </SidebarNavItem>
            <SidebarNavItem
              icon={<FaCog aria-label="Settings" />}
              active={activeItem === 'settings'}
              onClick={() => handleNavItemClick('settings')}
            >
              Settings
            </SidebarNavItem>
            <SidebarNavItem
              icon={<FaQuestionCircle aria-label="Help" />}
              active={activeItem === 'help'}
              onClick={() => handleNavItemClick('help')}
            >
              Help & FAQ
            </SidebarNavItem>
          </SidebarNav>
        </SidebarSection>
        
        <div className="sidebar-footer">
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              <FaUser aria-label="User" />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.email || 'User'}</div>
              <div className="user-status">
                <button className="logout-button" onClick={handleLogout}>
                  <FaSignOutAlt aria-label="Sign Out" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;