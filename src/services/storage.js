// Storage service for audio files supporting both Supabase and Firebase
import databaseConfig, { DB_PROVIDERS } from '../config/database';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class StorageService {
  constructor() {
    this.bucketName = 'audio-files';
  }

  // Upload audio file
  async uploadAudioFile(file, userId, fileName) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseUpload(file, userId, fileName);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseUpload(file, userId, fileName);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Supabase upload
  async supabaseUpload(file, userId, fileName) {
    const supabase = databaseConfig.getSupabaseClient();
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fullPath: filePath
    };
  }

  // Firebase upload
  async firebaseUpload(file, userId, fileName) {
    const storage = databaseConfig.getFirebaseStorage();
    const filePath = `${this.bucketName}/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      path: snapshot.ref.fullPath,
      url: downloadURL,
      fullPath: filePath
    };
  }

  // Delete audio file
  async deleteAudioFile(filePath) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseDelete(filePath);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseDelete(filePath);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Supabase delete
  async supabaseDelete(filePath) {
    const supabase = databaseConfig.getSupabaseClient();
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) throw error;
    return true;
  }

  // Firebase delete
  async firebaseDelete(filePath) {
    const storage = databaseConfig.getFirebaseStorage();
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return true;
  }

  // Get file URL
  async getFileUrl(filePath) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseGetUrl(filePath);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseGetUrl(filePath);
      }
    } catch (error) {
      console.error('Get URL error:', error);
      throw error;
    }
  }

  // Supabase get URL
  async supabaseGetUrl(filePath) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Firebase get URL
  async firebaseGetUrl(filePath) {
    const storage = databaseConfig.getFirebaseStorage();
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  }

  // List user files
  async listUserFiles(userId) {
    const provider = databaseConfig.getProvider();
    
    try {
      if (provider === DB_PROVIDERS.SUPABASE) {
        return await this.supabaseListFiles(userId);
      } else if (provider === DB_PROVIDERS.FIREBASE) {
        return await this.firebaseListFiles(userId);
      }
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  // Supabase list files
  async supabaseListFiles(userId) {
    const supabase = databaseConfig.getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(userId, {
        limit: 100,
        offset: 0
      });

    if (error) throw error;
    return data;
  }

  // Firebase list files (Note: Firebase doesn't have a direct list method for Storage)
  async firebaseListFiles(userId) {
    // For Firebase, we'll need to maintain a separate collection in Firestore
    // to track user files, as Firebase Storage doesn't support listing files directly
    const db = databaseConfig.getFirebaseDb();
    // This would require implementing a separate tracking system
    // For now, return empty array
    return [];
  }
}

// Create singleton instance
const storageService = new StorageService();

export default storageService;