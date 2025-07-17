// Authentication service supporting both Supabase and Firebase
import databaseConfig, { DB_PROVIDERS } from '../config/database';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
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
    if (!supabase) return;

    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      this.notifyAuthStateListeners(this.currentUser);
    });
  }

  // Firebase auth listener
  initializeFirebaseAuthListener() {
    const auth = databaseConfig.getFirebaseAuth();
    if (!auth) return;

    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  // Sign up with email and password
  async signUp(email, password, displayName = '') {
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