import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import LLMSelector from './components/LLMSelector';
import ChatSidebar from './components/ChatSidebar';
import ProfileMenu from './components/ProfileMenu';
import SettingsPage from './components/pages/SettingsPage';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import DirectLogin from './components/auth/DirectLogin';
import ExtensionsManager from './components/ExtensionsManager';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import './components/chat-container.css';

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
  const [activeChat, setActiveChat] = useState(null);
  // Initialize activePage based on localStorage or default to null
  const [activePage, setActivePage] = useState(() => {
    // Check if we should open chats directly
    const defaultPage = localStorage.getItem('defaultPage');
    console.log('Initial defaultPage from localStorage:', defaultPage);
    return defaultPage === 'chats' ? 'chats' : null;
  });
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isDirectAccess, setIsDirectAccess] = useState(false);
  
  // Check if this is a direct access request
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const directParam = urlParams.get('direct');
    if (directParam === 'true') {
      setIsDirectAccess(true);
    }
  }, []);
  
  // Listen for navigation events from MainLayout
  useEffect(() => {
    const handleNavigation = (event) => {
      const { page } = event.detail;
      
      console.log('Navigation event received:', page); // Debug log
      console.log('User authenticated:', !!user); // Debug log
      console.log('Current activePage:', activePage); // Debug log
      
      // Update active page based on navigation event
      switch(page) {
        case 'home':
          setActivePage(null);
          break;
        case 'chats':
          setActivePage('chats');
          break;
        case 'audio':
          setActivePage('audio');
          break;
        case 'extensions':
          setActivePage('extensions');
          break;
        case 'settings':
          setActivePage('settings');
          setSettingsTab('appearance');
          break;
        case 'user-profile':
          setActivePage('settings');
          setSettingsTab('userProfile');
          break;
        case 'help':
          setActivePage('settings');
          setSettingsTab('helpFaq');
          break;
        default:
          setActivePage(null);
      }
    };
    
    // Add event listener for navigation changes
    window.addEventListener('navigationChange', handleNavigation);
    console.log('Event listener added for navigationChange'); // Debug log
    
    // Check URL parameters for initial navigation
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      if (pageParam) {
        // Simulate a navigation event
        handleNavigation({ detail: { page: pageParam } });
      }
    }
    
    // Clean up event listener
    return () => {
      console.log('Removing event listener for navigationChange'); // Debug log
      window.removeEventListener('navigationChange', handleNavigation);
    };
  }, [user]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    const chatLLM = AVAILABLE_LLMS.find(llm => llm.name === chat.model) || AVAILABLE_LLMS[0];
    setSelectedLLM(chatLLM);
    setActivePage(null);
  };
  
  const handleOpenPage = (page) => {
    if (page === 'extensions') {
      setActivePage('extensions');
    } else {
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
        case 'user-profile':
          setSettingsTab('userProfile');
          break;
        case 'help-faq':
          setSettingsTab('helpFaq');
          break;
        default:
          setSettingsTab('appearance');
      }
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

  // Show authentication forms FIRST if not logged in
  if (!user) {
    // If database is not configured, show setup message
    if (!isInitialized) {
      return (
        <div className="app">
          <header className="app-header">
            <h1>AudioChat</h1>
          </header>
          <div className="app-content">
            <div className="setup-container">
              <h2>Welcome to AudioChat</h2>
              <p>Your AI-powered audio engineering assistant</p>
              <div className="setup-steps">
                <div className="setup-step active">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h3>Configure Database</h3>
                    <p>First, let's set up your database connection</p>
                    <button 
                      className="setup-button"
                      onClick={() => setActivePage('settings')}
                    >
                      Configure Database
                    </button>
                  </div>
                </div>
                <div className="setup-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h3>Sign In</h3>
                    <p>Then you can sign in or create an account</p>
                  </div>
                </div>
              </div>
              {activePage && (
                <SettingsPage 
                  onClose={() => setActivePage(null)} 
                  initialTab="database"
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    // If database is configured, show auth forms
    return (
      <div className="app">
        <header className="app-header">
          <h1>AudioChat</h1>
        </header>
        <div className="app-content">
          <div className="auth-container">
            <div className="auth-welcome">
              <h2>Welcome to AudioChat</h2>
              <p>Your AI-powered audio engineering assistant</p>
            </div>
            {isDirectAccess ? (
              <DirectLogin />
            ) : authMode === 'login' ? (
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
  
  // At this point, user is authenticated and database is configured
  
  // Import the new components
  const MainLayout = React.lazy(() => import('./components/MainLayout'));
  const HomePage = React.lazy(() => import('./components/HomePage'));

  // Show main app interface for authenticated users
  return (
    <React.Suspense fallback={
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading interface...</p>
      </div>
    }>
      <MainLayout>
        {activePage === 'settings' ? (
          <SettingsPage 
            onClose={() => setActivePage(null)} 
            initialTab={settingsTab}
          />
        ) : activePage === 'extensions' ? (
          <div className="page-container">
            <div className="page-header">
              <h2 className="page-title">Extensions Manager</h2>
            </div>
            <ExtensionsManager />
          </div>
        ) : activePage === 'chats' ? (
          <div className="page-container">
            <div className="page-header">
              <h2 className="page-title">Chats</h2>
            </div>
            <div className="chat-container">
              <ChatSidebar 
                onSelectChat={handleSelectChat}
                activeChat={activeChat}
              />
              <ChatInterface 
                selectedLLM={selectedLLM}
                messages={messages}
                setMessages={setMessages}
                activeChat={activeChat}
              />
            </div>
          </div>
        ) : activePage === 'audio' ? (
          <div className="page-container">
            <div className="page-header">
              <h2 className="page-title">Audio Processing</h2>
            </div>
            <div className="audio-processing-placeholder">
              <p>Audio processing interface would be displayed here.</p>
            </div>
          </div>
        ) : (
          // Show home page when no specific page is active
          <HomePage />
        )}
      </MainLayout>
    </React.Suspense>
  );
}

// Main App component with providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;