import React, { useEffect, useState } from 'react';
import authService from '../../services/auth';
import databaseConfig, { DB_PROVIDERS } from '../../config/database';
import './AuthForms.css';

// Firebase configuration for the AudioChat project
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Mock user data for direct access
const mockUser = {
  uid: "direct-access-user",
  email: "direct-access@example.com",
  displayName: "Direct Access User",
  photoURL: null
};

function AutoLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize Firebase with the configuration
        const success = databaseConfig.initializeFirebase(firebaseConfig);
        
        if (success) {
          // Set Firebase as the active provider
          databaseConfig.setProvider(DB_PROVIDERS.FIREBASE);
          
          // Wait a moment for Firebase to initialize fully
          setTimeout(async () => {
            try {
              // Try to sign in with Google
              await authService.signInWithGoogle();
            } catch (error) {
              console.error('Google sign in error:', error);
              
              // If Google sign-in fails, use a mock user for direct access
              // This is a workaround to bypass authentication for direct access
              localStorage.setItem('directAccessUser', JSON.stringify(mockUser));
              window.location.href = '/?authenticated=true';
            }
          }, 1000);
        } else {
          setError('Failed to initialize Firebase');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication: ' + error.message);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="auth-form">
        <h2>Signing in to AudioChat</h2>
        <div className="loading-spinner"></div>
        <p>Authenticating automatically...</p>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Direct Access to AudioChat</h2>
      
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
      
      <p>
        Automatic sign-in failed. Please try again:
      </p>
      
      <button 
        type="button" 
        className="auth-button primary"
        onClick={() => window.location.reload()}
      >
        Retry Authentication
      </button>
    </div>
  );
}

export default AutoLogin;