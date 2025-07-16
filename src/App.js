import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import LLMSelector from './components/LLMSelector';
import ChatSidebar from './components/ChatSidebar';
import ProfileMenu from './components/ProfileMenu';
import SettingsPage from './components/pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';
import './App.css';

const AVAILABLE_LLMS = [
  { id: 'openai', name: 'OpenAI GPT', endpoint: '/api/openai' },
  { id: 'anthropic', name: 'Anthropic Claude', endpoint: '/api/anthropic' },
  { id: 'google', name: 'Google Gemini', endpoint: '/api/google' },
  { id: 'local', name: 'Local LLM', endpoint: '/api/local' }
];

function App() {
  const [selectedLLM, setSelectedLLM] = useState(AVAILABLE_LLMS[0]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState({ id: 1, title: 'New Chat', model: 'OpenAI GPT', date: 'Today' });
  const [activePage, setActivePage] = useState(null); // null means show chat interface
  const [settingsTab, setSettingsTab] = useState('appearance'); // Default settings tab

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    // In a real app, we would load the messages for this chat
    setMessages([]); // Clear messages for demo purposes
    // Set the selected LLM based on the chat's model
    const chatLLM = AVAILABLE_LLMS.find(llm => llm.name === chat.model) || AVAILABLE_LLMS[0];
    setSelectedLLM(chatLLM);
    // Close any open page when selecting a chat
    setActivePage(null);
  };
  
  const handleOpenPage = (page) => {
    setActivePage('settings');
    
    // Set the appropriate settings tab based on the page selected
    switch(page) {
      case 'appearance':
        setSettingsTab('appearance');
        break;
      case 'api-keys':
        setSettingsTab('apiKeys');
        break;
      case 'help-faq':
        setSettingsTab('helpFaq');
        break;
      default:
        setSettingsTab('appearance');
    }
  };

  return (
    <SettingsProvider>
      <div className="app">
        <header className="app-header">
          <h1>AudioChat</h1>
          <div className="header-controls">
            <LLMSelector 
              llms={AVAILABLE_LLMS}
              selected={selectedLLM}
              onSelect={setSelectedLLM}
            />
            <ProfileMenu onOpenPage={handleOpenPage} />
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
    </SettingsProvider>
  );
}

export default App;