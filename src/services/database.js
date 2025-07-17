// Database service for managing user data and audio projects
import databaseConfig, { DB_PROVIDERS } from '../config/database';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

class DatabaseService {
  constructor() {
    this.tables = {
      PROJECTS: 'audio_projects',
      CONVERSATIONS: 'conversations',
      USER_SETTINGS: 'user_settings'
    };
  }

  // Create audio project
  async createAudioProject(userId, projectData) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseCreateProject(userId, projectData);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseCreateProject(userId, projectData);
      }
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }

  // Supabase create project
  async supabaseCreateProject(userId, projectData) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase
      .from(this.tables.PROJECTS)
      .insert([{
        user_id: userId,
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Firebase create project
  async firebaseCreateProject(userId, projectData) {
    const db = databaseConfig.getFirebaseDb();
    const projectsRef = collection(db, this.tables.PROJECTS);
    
    const docRef = await addDoc(projectsRef, {
      userId,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { id: docRef.id, ...projectData };
  }

  // Get user projects
  async getUserProjects(userId, limitCount = 50) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseGetUserProjects(userId, limitCount);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseGetUserProjects(userId, limitCount);
      }
    } catch (error) {
      console.error('Get user projects error:', error);
      throw error;
    }
  }

  // Supabase get user projects
  async supabaseGetUserProjects(userId, limitCount) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase
      .from(this.tables.PROJECTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data;
  }

  // Firebase get user projects
  async firebaseGetUserProjects(userId, limitCount) {
    const db = databaseConfig.getFirebaseDb();
    const projectsRef = collection(db, this.tables.PROJECTS);
    const q = query(
      projectsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Update project
  async updateProject(projectId, updates) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseUpdateProject(projectId, updates);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseUpdateProject(projectId, updates);
      }
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }

  // Supabase update project
  async supabaseUpdateProject(projectId, updates) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase
      .from(this.tables.PROJECTS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Firebase update project
  async firebaseUpdateProject(projectId, updates) {
    const db = databaseConfig.getFirebaseDb();
    const projectRef = doc(db, this.tables.PROJECTS, projectId);
    
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: new Date()
    });

    return { id: projectId, ...updates };
  }

  // Delete project
  async deleteProject(projectId) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseDeleteProject(projectId);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseDeleteProject(projectId);
      }
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }

  // Supabase delete project
  async supabaseDeleteProject(projectId) {
    const supabase = databaseConfig.getSupabaseClient();
    const { error } = await supabase
      .from(this.tables.PROJECTS)
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return true;
  }

  // Firebase delete project
  async firebaseDeleteProject(projectId) {
    const db = databaseConfig.getFirebaseDb();
    const projectRef = doc(db, this.tables.PROJECTS, projectId);
    await deleteDoc(projectRef);
    return true;
  }

  // Save user settings
  async saveUserSettings(userId, settings) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseSaveSettings(userId, settings);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseSaveSettings(userId, settings);
      }
    } catch (error) {
      console.error('Save settings error:', error);
      throw error;
    }
  }

  // Supabase save settings
  async supabaseSaveSettings(userId, settings) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase
      .from(this.tables.USER_SETTINGS)
      .upsert([{
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Firebase save settings
  async firebaseSaveSettings(userId, settings) {
    const db = databaseConfig.getFirebaseDb();
    const settingsRef = doc(db, this.tables.USER_SETTINGS, userId);
    
    await updateDoc(settingsRef, {
      settings,
      updatedAt: new Date()
    });

    return { userId, settings };
  }

  // Get user settings
  async getUserSettings(userId) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseGetSettings(userId);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseGetSettings(userId);
      }
    } catch (error) {
      console.error('Get settings error:', error);
      return null;
    }
  }

  // Supabase get settings
  async supabaseGetSettings(userId) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase
      .from(this.tables.USER_SETTINGS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.settings || null;
  }

  // Firebase get settings
  async firebaseGetSettings(userId) {
    const db = databaseConfig.getFirebaseDb();
    const settingsRef = doc(db, this.tables.USER_SETTINGS, userId);
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      return docSnap.data().settings;
    }
    return null;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;