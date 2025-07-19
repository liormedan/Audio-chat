import React, { useState, useEffect } from 'react';
import databaseConfig, { DB_PROVIDERS } from '../../config/database';
import './Pages.css';
import { FaCheckCircle } from 'react-icons/fa';

function DatabaseConfigPage() {
  const [selectedProvider, setSelectedProvider] = useState(databaseConfig.getProvider());
  const [isInitialized, setIsInitialized] = useState(databaseConfig.isInitialized());
  
  // Supabase configuration
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('supabase_key') || ''
  );
  
  // Firebase configuration
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: localStorage.getItem('firebase_api_key') || '',
    authDomain: localStorage.getItem('firebase_auth_domain') || '',
    projectId: localStorage.getItem('firebase_project_id') || '',
    storageBucket: localStorage.getItem('firebase_storage_bucket') || '',
    messagingSenderId: localStorage.getItem('firebase_messaging_sender_id') || '',
    appId: localStorage.getItem('firebase_app_id') || ''
  });

  const [connectionStatus, setConnectionStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsInitialized(databaseConfig.isInitialized());
  }, [selectedProvider]);

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    databaseConfig.setProvider(provider);
    setConnectionStatus('');
  };

  const handleSupabaseConnect = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setConnectionStatus('Please enter both Supabase URL and API key');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Connecting to Supabase...');

    try {
      const success = databaseConfig.initializeSupabase(supabaseUrl, supabaseKey);
      
      if (success) {
        // Save credentials to localStorage
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_key', supabaseKey);
        
        setConnectionStatus('Successfully connected to Supabase!');
        setIsInitialized(true);
      } else {
        setConnectionStatus('Failed to connect to Supabase. Please check your credentials.');
      }
    } catch (error) {
      setConnectionStatus(`Connection error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFirebaseConnect = async () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
    
    if (missingFields.length > 0) {
      setConnectionStatus(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Connecting to Firebase...');

    try {
      const success = databaseConfig.initializeFirebase(firebaseConfig);
      
      if (success) {
        // Save credentials to localStorage
        Object.keys(firebaseConfig).forEach(key => {
          localStorage.setItem(`firebase_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`, firebaseConfig[key]);
        });
        
        setConnectionStatus('Successfully connected to Firebase!');
        setIsInitialized(true);
      } else {
        setConnectionStatus('Failed to connect to Firebase. Please check your configuration.');
      }
    } catch (error) {
      setConnectionStatus(`Connection error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFirebaseConfigChange = (field, value) => {
    setFirebaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearConfiguration = () => {
    if (selectedProvider === DB_PROVIDERS.SUPABASE) {
      setSupabaseUrl('');
      setSupabaseKey('');
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
    } else {
      setFirebaseConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      });
      Object.keys(firebaseConfig).forEach(key => {
        localStorage.removeItem(`firebase_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`);
      });
    }
    setConnectionStatus('Configuration cleared');
    setIsInitialized(false);
  };

  return (
    <div className="settings-page">
      <div className="settings-section">
        <h4>Database Provider</h4>
        <p className="settings-description">
          Choose your preferred database provider for storing user data and audio projects.
        </p>
        
        <div className="provider-selection">
          <div className="radio-options">
            <div className="radio-option">
              <input 
                type="radio" 
                id="provider-supabase" 
                name="provider" 
                value={DB_PROVIDERS.SUPABASE}
                checked={selectedProvider === DB_PROVIDERS.SUPABASE}
                onChange={(e) => handleProviderChange(e.target.value)}
              />
              <label htmlFor="provider-supabase">
                <strong>Supabase</strong>
                <span className="provider-description">Open source Firebase alternative with PostgreSQL</span>
              </label>
            </div>
            
            <div className="radio-option">
              <input 
                type="radio" 
                id="provider-firebase" 
                name="provider" 
                value={DB_PROVIDERS.FIREBASE}
                checked={selectedProvider === DB_PROVIDERS.FIREBASE}
                onChange={(e) => handleProviderChange(e.target.value)}
              />
              <label htmlFor="provider-firebase">
                <strong>Firebase</strong>
                <span className="provider-description">Google's mobile and web application development platform</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {selectedProvider === DB_PROVIDERS.SUPABASE && (
        <div className="settings-section">
          <h4>Supabase Configuration</h4>
          <div className="form-group">
            <label htmlFor="supabase-url">Supabase URL</label>
            <input 
              type="url"
              id="supabase-url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="supabase-key">Supabase Anon Key</label>
            <input 
              type="password"
              id="supabase-key"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Your Supabase anonymous key"
              className="config-input"
            />
          </div>
          
          <div className="config-actions">
            <button 
              className="settings-button primary"
              onClick={handleSupabaseConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Supabase'}
            </button>
            <button 
              className="settings-button secondary"
              onClick={clearConfiguration}
            >
              Clear Configuration
            </button>
          </div>
        </div>
      )}

      {selectedProvider === DB_PROVIDERS.FIREBASE && (
        <div className="settings-section">
          <h4>Firebase Configuration</h4>
          <p className="settings-description">
            Enter your Firebase project configuration. You can find these values in your Firebase project settings.
          </p>
          
          <div className="form-group">
            <label htmlFor="firebase-api-key">API Key *</label>
            <input 
              type="password"
              id="firebase-api-key"
              value={firebaseConfig.apiKey}
              onChange={(e) => handleFirebaseConfigChange('apiKey', e.target.value)}
              placeholder="Your Firebase API key"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firebase-auth-domain">Auth Domain *</label>
            <input 
              type="text"
              id="firebase-auth-domain"
              value={firebaseConfig.authDomain}
              onChange={(e) => handleFirebaseConfigChange('authDomain', e.target.value)}
              placeholder="your-project.firebaseapp.com"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firebase-project-id">Project ID *</label>
            <input 
              type="text"
              id="firebase-project-id"
              value={firebaseConfig.projectId}
              onChange={(e) => handleFirebaseConfigChange('projectId', e.target.value)}
              placeholder="your-project-id"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firebase-storage-bucket">Storage Bucket *</label>
            <input 
              type="text"
              id="firebase-storage-bucket"
              value={firebaseConfig.storageBucket}
              onChange={(e) => handleFirebaseConfigChange('storageBucket', e.target.value)}
              placeholder="your-project.appspot.com"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firebase-messaging-sender-id">Messaging Sender ID</label>
            <input 
              type="text"
              id="firebase-messaging-sender-id"
              value={firebaseConfig.messagingSenderId}
              onChange={(e) => handleFirebaseConfigChange('messagingSenderId', e.target.value)}
              placeholder="123456789"
              className="config-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firebase-app-id">App ID</label>
            <input 
              type="text"
              id="firebase-app-id"
              value={firebaseConfig.appId}
              onChange={(e) => handleFirebaseConfigChange('appId', e.target.value)}
              placeholder="1:123456789:web:abcdef123456"
              className="config-input"
            />
          </div>
          
          <div className="config-actions">
            <button 
              className="settings-button primary"
              onClick={handleFirebaseConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Firebase'}
            </button>
            <button 
              className="settings-button secondary"
              onClick={clearConfiguration}
            >
              Clear Configuration
            </button>
          </div>
        </div>
      )}

      {connectionStatus && (
        <div className={`connection-status ${isInitialized ? 'success' : 'error'}`}>
          {connectionStatus}
        </div>
      )}

      {isInitialized && (
        <div className="settings-section">
          <h4>Connection Status</h4>
          <div className="status-indicator success">
            <FaCheckCircle aria-label="Connected" /> Connected to {selectedProvider === DB_PROVIDERS.SUPABASE ? 'Supabase' : 'Firebase'}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatabaseConfigPage;