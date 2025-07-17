import React, { useState } from 'react';
import AppearancePage from './AppearancePage';
import ApiKeysPage from './ApiKeysPage';
import HelpFaqPage from './HelpFaqPage';
import DatabaseConfigPage from './DatabaseConfigPage';
import './Pages.css';

function SettingsPage({ onClose, initialTab = 'appearance' }) {
  const [activePage, setActivePage] = useState(initialTab);

  const renderActivePage = () => {
    switch (activePage) {
      case 'appearance':
        return <AppearancePage />;
      case 'apiKeys':
        return <ApiKeysPage />;
      case 'database':
        return <DatabaseConfigPage />;
      case 'helpFaq':
        return <HelpFaqPage />;
      default:
        return <AppearancePage />;
    }
  };

  return (
    <div className="settings-container">
      <div>
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activePage === 'appearance' ? 'active' : ''}`}
              onClick={() => setActivePage('appearance')}
            >
              <span className="settings-nav-icon">🎨</span>
              Appearance
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'database' ? 'active' : ''}`}
              onClick={() => setActivePage('database')}
            >
              <span className="settings-nav-icon">🗄️</span>
              Database
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'apiKeys' ? 'active' : ''}`}
              onClick={() => setActivePage('apiKeys')}
            >
              <span className="settings-nav-icon">🔑</span>
              API Keys
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'helpFaq' ? 'active' : ''}`}
              onClick={() => setActivePage('helpFaq')}
            >
              <span className="settings-nav-icon">❓</span>
              Help & FAQ
            </button>
          </nav>
        </div>
        <div className="settings-content">
          <div className="settings-header">
            <h3>
              {activePage === 'appearance' && 'Appearance'}
              {activePage === 'database' && 'Database Configuration'}
              {activePage === 'apiKeys' && 'API Keys'}
              {activePage === 'helpFaq' && 'Help & FAQ'}
            </h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="settings-body">
            {renderActivePage()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;