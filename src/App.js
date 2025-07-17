import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import LLMSelector from './components/LLMSelector';
import ChatSidebar from './components/ChatSidebar';
import ProfileMenu from './components/ProfileMenu';
import SettingsPage from './components/pages/SettingsPage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import databaseConfig from './config/database';
import './App.css';

const AVAILABLE_LLMS = [
  { id: 'openai', name: 'OpenAI GPT', endpoint: '/api/openai' },
  { id: 'anthropic', name: 'Anthropic Claude', endpoint: '/api/anthropic' },
  { id: 'google', name: 'Google Gemini', endpoint: '/api/google' },
  { id: 'local', name: 'Local LLM', endpoint: '/api/local' }
];

// Main app content component that handles authentication flow
function AppContent() {
  const { user, isLoading, isInitialized, signOut } = useAuth();
  const [selectedLLM, setSelectedLLM] = useState(AVAILABLE_LLMS[0]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState({ id: 1, title: 'New Chat', model: 'OpenAI GPT', date: 'Today' });
  const [activePage, setActivePage] = useState(null);
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    const chatLLM = AVAILABLE_LLMS.find(llm => llm.name === chat.model) || AVAILABLE_LLMS[0];
    setSelectedLLM(chatLLM);
    setActivePage(null);
  };
  
  const handleOpenPage = (page) => {
    setActivePage('settings');
    
    switch(page) {
      case 'appearance':
        setSettingsTab('appearance');
        break;
      case 'api-keys':
        setSettingsTab('apiKeys');
        break;
      case 'database':
        setSettingsTab('database');
        break;
      case 'help-faq':
        setSettingsTab('helpFaq');
        break;
      default:
        setSettingsTab('appearance');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading AudioChat...</p>
      </div>
    );
  }

  // Show database configuration if not initialized
  if (!isInitialized) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>AudioChat</h1>
        </header>
        <div className="app-content">
          <div className="setup-container">
            <h2>Welcome to AudioChat</h2>
            <p>Please configure your database connection to get started.</p>
            <SettingsPage 
              onClose={() => {}} 
              initialTab="database"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show authentication forms if not logged in
  if (!user) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>AudioChat</h1>
        </header>
        <div className="app-content">
          <div className="auth-container">
            {authMode === 'login' ? (
              <LoginForm 
                onSuccess={() => {}}
                onSwitchToSignup={() => setAuthMode('signup')}
              />
            ) : (
              <SignupForm 
                onSuccess={() => {}}
                onSwitchToLogin={() => setAuthMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show main app interface for authenticated users
  return (
    <div className="app">
      <header className="app-header">
        <h1>AudioChat</h1>
        <div className="header-controls">
          <LLMSelector 
            llms={AVAILABLE_LLMS}
            selected={selectedLLM}
            onSelect={setSelectedLLM}
          />
          <ProfileMenu onOpenPage={handleOpenPage} onLogout={handleLogout} />
        </div>
      </header>
      <div className="app-content">
        <ChatSidebar 
          onSelectChat={handleSelectChat}
          activeChat={activeChat}
        />
        <main className="app-main">
          {activePage ? (
            <SettingsPage 
              onClose={() => setActivePage(null)} 
              initialTab={settingsTab}
            />
          ) : (
            <ChatInterface 
              selectedLLM={selectedLLM}
              messages={messages}
              setMessages={setMessages}
              activeChat={activeChat}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Main App component with providers
function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;