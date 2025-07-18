// Authentication service supporting both Supabase and Firebase
import databaseConfig, { DB_PROVIDERS } from '../config/database';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  initializeAuthListener() {
    const provider = databaseConfig.getProvider();
    
    if (provider === DB_PROVIDERS.SUPABASE) {
      this.initializeSupabaseAuthListener();
    } else if (provider === DB_PROVIDERS.FIREBASE) {
      this.initializeFirebaseAuthListener();
    }
  }

  // Supabase auth listener
  initializeSupabaseAuthListener() {
    const supabase = databaseConfig.getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return;
    }

    try {
      supabase.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
        this.notifyAuthStateListeners(this.currentUser);
      });
    } catch (error) {
      console.error('Error initializing Supabase auth listener:', error);
    }
  }

  // Firebase auth listener
  initializeFirebaseAuthListener() {
    const auth = databaseConfig.getFirebaseAuth();
    if (!auth) {
      console.warn('Firebase auth not initialized');
      return;
    }

    try {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.notifyAuthStateListeners(user);
      });
    } catch (error) {
      console.error('Error initializing Firebase auth listener:', error);
    }
  }

  // Sign up with email and password
  async signUp(email, password, displayName = '') {
    if (!databaseConfig.isInitialized()) {
      throw new Error('Please configure your database connection first');
    }
    
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseSignUp(email, password, displayName);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseSignUp(email, password, displayName);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Supabase sign up
  async supabaseSignUp(email, password, displayName) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) throw error;
    return data;
  }

  // Firebase sign up
  async firebaseSignUp(email, password, displayName) {
    const auth = databaseConfig.getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    return userCredential;
  }

  // Sign in with email and password
  async signIn(email, password) {
    if (!databaseConfig.isInitialized()) {
      throw new Error('Please configure your database connection first');
    }
    
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseSignIn(email, password);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseSignIn(email, password);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Supabase sign in
  async supabaseSignIn(email, password) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  // Firebase sign in
  async firebaseSignIn(email, password) {
    const auth = databaseConfig.getFirebaseAuth();
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  async signInWithGoogle() {
    if (!databaseConfig.isInitialized()) {
      throw new Error('Please configure your database connection first');
    }
    
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseSignInWithGoogle();
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseSignInWithGoogle();
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  // Supabase Google sign in
  async supabaseSignInWithGoogle() {
    const supabase = databaseConfig.getSupabaseClient();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          throw new Error("Google authentication is not enabled in your Supabase project. Please enable it in the Supabase dashboard under Authentication > Providers > Google.");
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  // Firebase Google sign in
  async firebaseSignInWithGoogle() {
    const auth = databaseConfig.getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  }

  // Sign out
  async signOut() {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        const supabase = databaseConfig.getSupabaseClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        const auth = databaseConfig.getFirebaseAuth();
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Retrieve JWT token for current user
  async getAuthToken() {
    if (!this.currentUser) return null;

    const provider = databaseConfig.getProvider();

    try {
      if (provider === DB_PROVIDERS.FIREBASE && this.currentUser.getIdToken) {
        return await this.currentUser.getIdToken();
      }

      if (provider === DB_PROVIDERS.SUPABASE) {
        const supabase = databaseConfig.getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session?.access_token || null;
      }

      if (this.currentUser.id_token) {
        return this.currentUser.id_token;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }

    return null;
  }

  // Add auth state listener
  addAuthStateListener(callback) {
    this.authStateListeners.push(callback);
  }

  // Remove auth state listener
  removeAuthStateListener(callback) {
    this.authStateListeners = this.authStateListeners.filter(
      listener => listener !== callback
    );
  }

  // Notify all auth state listeners
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => callback(user));
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;