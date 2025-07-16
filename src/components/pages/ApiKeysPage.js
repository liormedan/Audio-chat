import React, { useState } from 'react';
import './Pages.css';

function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState({
    openai: '••••••••••••••••••••••••••••••',
    anthropic: '',
    google: '',
    local: 'http://localhost:11434'
  });
  
  const [showOpenAI, setShowOpenAI] = useState(false);
  
  const handleKeyChange = (provider, value) => {
    setApiKeys({
      ...apiKeys,
      [provider]: value
    });
  };
  
  return (
    <div className="settings-page">
      <div className="settings-section">
        <p className="settings-description">
          Configure API keys for different LLM providers. Your keys are stored locally and are never sent to our servers.
        </p>
      </div>
      
      <div className="settings-section">
        <h4>OpenAI API Key</h4>
        <div className="api-key-input">
          <input 
            type={showOpenAI ? "text" : "password"} 
            value={apiKeys.openai}
            onChange={(e) => handleKeyChange('openai', e.target.value)}
            placeholder="Enter your OpenAI API key"
          />
          <button 
            className="toggle-visibility" 
            onClick={() => setShowOpenAI(!showOpenAI)}
          >
            {showOpenAI ? "Hide" : "Show"}
          </button>
        </div>
        <div className="api-key-help">
          Get your API key from the <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">OpenAI dashboard</a>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Anthropic API Key</h4>
        <div className="api-key-input">
          <input 
            type="password" 
            value={apiKeys.anthropic}
            onChange={(e) => handleKeyChange('anthropic', e.target.value)}
            placeholder="Enter your Anthropic API key"
          />
        </div>
        <div className="api-key-help">
          Get your API key from the <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic console</a>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Google AI API Key</h4>
        <div className="api-key-input">
          <input 
            type="password" 
            value={apiKeys.google}
            onChange={(e) => handleKeyChange('google', e.target.value)}
            placeholder="Enter your Google AI API key"
          />
        </div>
        <div className="api-key-help">
          Get your API key from the <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Local LLM Endpoint</h4>
        <div className="api-key-input">
          <input 
            type="text" 
            value={apiKeys.local}
            onChange={(e) => handleKeyChange('local', e.target.value)}
            placeholder="Enter your local LLM endpoint URL"
          />
        </div>
        <div className="api-key-help">
          Default: http://localhost:11434 (Ollama)
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="settings-button primary">Save Keys</button>
        <button className="settings-button secondary">Test Connections</button>
      </div>
    </div>
  );
}

export default ApiKeysPage;