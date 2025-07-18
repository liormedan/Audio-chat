import React, { useEffect, useState } from 'react';
import authService from '../../services/auth';
import databaseConfig, { DB_PROVIDERS } from '../../config/database';
import './AuthForms.css';

// Firebase configuration for the AudioChat project
const firebaseConfig = {
  apiKey: "AIzaSyDJQw_TKGUQJGGwzS8LG9CZ_9QXW9Jj4Vc",
  authDomain: "audiochat-466211.firebaseapp.com",
  projectId: "audiochat-466211",
  storageBucket: "audiochat-466211.appspot.com",
  messagingSenderId: "484800218204",
  appId: "1:484800218204:web:3b5e9f9d7d56a9e9f9d7d5"
};

function DirectLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use the hardcoded client ID from the secrets file
        const clientId = "484800218204-8snu9s0vvc9176aqug9759ulh1rio431.apps.googleusercontent.com";
        // We don't need to store the client ID in state anymore
        
        // Initialize Firebase with the configuration
        const success = databaseConfig.initializeFirebase(firebaseConfig);
        
        if (success) {
          // Set Firebase as the active provider
          databaseConfig.setProvider(DB_PROVIDERS.FIREBASE);
          
          // Wait a moment for Firebase to initialize fully
          setTimeout(async () => {
            try {
              // Attempt automatic sign-in with Google
              await handleGoogleSignIn();
            } catch (error) {
              console.error('Delayed Google sign in error:', error);
              setError('Failed to sign in with Google: ' + error.message);
              setIsLoading(false);
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

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
      // Success - the AuthContext will handle the user state
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google: ' + error.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-form">
        <h2>Signing in to AudioChat</h2>
        <div className="loading-spinner"></div>
        <p>Authenticating with Google...</p>
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
        Automatic sign-in failed. Please try signing in manually:
      </p>
      
      <button 
        type="button" 
        className="auth-button google"
        onClick={handleGoogleSignIn}
      >
        <svg className="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}

export default DirectLogin;