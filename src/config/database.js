// Database configuration for Supabase and Firebase
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Database provider types
export const DB_PROVIDERS = {
  SUPABASE: 'supabase',
  FIREBASE: 'firebase'
};

// Configuration class for database providers
class DatabaseConfig {
  constructor() {
    this.provider = localStorage.getItem('db_provider') || DB_PROVIDERS.SUPABASE;
    this.supabaseClient = null;
    this.firebaseApp = null;
    this.firebaseAuth = null;
    this.firebaseDb = null;
    this.firebaseStorage = null;
  }

  // Initialize Supabase
  initializeSupabase(supabaseUrl, supabaseKey) {
    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Supabase:', error);
      return false;
    }
  }

  // Initialize Firebase
  initializeFirebase(firebaseConfig) {
    try {
      this.firebaseApp = initializeApp(firebaseConfig);
      this.firebaseAuth = getAuth(this.firebaseApp);
      this.firebaseDb = getFirestore(this.firebaseApp);
      this.firebaseStorage = getStorage(this.firebaseApp);
      console.log('Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return false;
    }
  }

  // Set active provider
  setProvider(provider) {
    this.provider = provider;
    localStorage.setItem('db_provider', provider);
  }

  // Get active provider
  getProvider() {
    return this.provider;
  }

  // Get Supabase client
  getSupabaseClient() {
    return this.supabaseClient;
  }

  // Get Firebase services
  getFirebaseAuth() {
    return this.firebaseAuth;
  }

  getFirebaseDb() {
    return this.firebaseDb;
  }

  getFirebaseStorage() {
    return this.firebaseStorage;
  }

  // Check if provider is initialized
  isInitialized() {
    if (this.provider === DB_PROVIDERS.SUPABASE) {
      return this.supabaseClient !== null;
    } else if (this.provider === DB_PROVIDERS.FIREBASE) {
      return this.firebaseApp !== null;
    }
    return false;
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

export default databaseConfig;