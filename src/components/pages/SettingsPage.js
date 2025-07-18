import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppearancePage from './AppearancePage';
import ApiKeysPage from './ApiKeysPage';
import HelpFaqPage from './HelpFaqPage';
import DatabaseConfigPage from './DatabaseConfigPage';
import './Pages.css';
import { FaSlidersH, FaDatabase, FaKey, FaQuestionCircle } from 'react-icons/fa';

function SettingsPage({ onClose, initialTab = 'appearance' }) {
  const { t } = useTranslation();
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
          <h2>{t('settings.title')}</h2>
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activePage === 'appearance' ? 'active' : ''}`}
              onClick={() => setActivePage('appearance')}
            >
              <FaSlidersH aria-label="Appearance" className="settings-nav-icon" />
              {t('settings.appearance')}
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'database' ? 'active' : ''}`}
              onClick={() => setActivePage('database')}
            >
              <FaDatabase aria-label="Database" className="settings-nav-icon" />
              {t('settings.database')}
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'apiKeys' ? 'active' : ''}`}
              onClick={() => setActivePage('apiKeys')}
            >
              <FaKey aria-label="API Keys" className="settings-nav-icon" />
              {t('settings.apiKeys')}
            </button>
            <button 
              className={`settings-nav-item ${activePage === 'helpFaq' ? 'active' : ''}`}
              onClick={() => setActivePage('helpFaq')}
            >
              <FaQuestionCircle aria-label="Help" className="settings-nav-icon" />
              {t('settings.helpFaq')}
            </button>
          </nav>
        </div>
        <div className="settings-content">
          <div className="settings-header">
            <h3>
              {activePage === 'appearance' && t('settings.header.appearance')}
              {activePage === 'database' && t('settings.header.database')}
              {activePage === 'apiKeys' && t('settings.header.apiKeys')}
              {activePage === 'helpFaq' && t('settings.header.helpFaq')}
            </h3>
            <button className="close-button" onClick={onClose} aria-label="Close settings">×</button>
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