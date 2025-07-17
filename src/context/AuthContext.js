import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth';
import databaseConfig from '../config/database';

// Create the context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Always set loading to false initially to show auth forms
    setIsLoading(false);
    
    // Check if database is configured
    const checkInitialization = () => {
      const initialized = databaseConfig.isInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        try {
          // Initialize auth listener only if database is configured
          authService.initializeAuthListener();
          
          // Add auth state listener
          authService.addAuthStateListener((user) => {
            setUser(user);
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
        }
      }
    };

    checkInitialization();

    // Check periodically if database gets initialized
    const interval = setInterval(() => {
      if (!isInitialized && databaseConfig.isInitialized()) {
        checkInitialization();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized]);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      await authService.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email, password, displayName) => {
    try {
      await authService.signUp(email, password, displayName);
    } catch (error) {
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      throw error;
    }
  };

  // Value to be provided by the context
  const contextValue = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    isAuthenticated: user !== null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;