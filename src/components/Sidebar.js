import React from 'react';
import './Sidebar.css';

const Sidebar = ({ children, className }) => {
  return (
    <div className={`sidebar ${className || ''}`}>
      {children}
    </div>
  );
};

export const SidebarSection = ({ children, className, title }) => {
  return (
    <div className={`sidebar-section ${className || ''}`}>
      {title && <h3 className="sidebar-section-title">{title}</h3>}
      {children}
    </div>
  );
};

export const SidebarNav = ({ children, className }) => {
  return (
    <nav className={`sidebar-nav ${className || ''}`}>
      {children}
    </nav>
  );
};

export const SidebarNavItem = ({ children, className, active, icon, onClick }) => {
  return (
    <button 
      className={`sidebar-nav-item ${active ? 'active' : ''} ${className || ''}`}
      onClick={onClick}
    >
      {icon && <span className="sidebar-nav-item-icon">{icon}</span>}
      <span className="sidebar-nav-item-text">{children}</span>
    </button>
  );
};

export default Sidebar;