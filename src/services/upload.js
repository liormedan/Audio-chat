// Upload service with authentication
import authService from './auth';

class UploadService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  // Get auth headers for API requests
  async getAuthHeaders() {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // For Firebase, get the ID token
    if (user.getIdToken) {
      const token = await user.getIdToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }

    // For Supabase, use the access token
    if (user.access_token) {
      return {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json'
      };
    }

    // For Google OAuth direct integration
    if (user.id_token) {
      return {
        'Authorization': `Bearer ${user.id_token}`,
        'Content-Type': 'application/json'
      };
    }

    // For development testing
    if (process.env.NODE_ENV === 'development') {
      return {
        'Authorization': 'Bearer dev_test_token',
        'Content-Type': 'application/json'
      };
    }

    throw new Error('Unable to get authentication token');
  }

  // Upload audio file with authentication
  async uploadAudio(file, onProgress = null) {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to upload files');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get authentication headers
      const authHeaders = await this.getAuthHeaders();
      
      // Remove content-type so browser can set it with boundary for FormData
      const { 'Content-Type': contentType, ...headers } = authHeaders;

      const response = await fetch(`${this.baseURL}/api/audio/upload`, {
        method: 'POST',
        headers,
        body: formData,
        // Track upload progress if callback provided
        ...(onProgress && {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        if (response.status === 413) {
          throw new Error('File too large. Please choose a smaller file.');
        }
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Process uploaded audio with authentication
  async processAudio(fileId, instructions) {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to process audio');
    }

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/audio/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_id: fileId,
          instructions
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  }
  
  // Process audio with specific effects parameters
  async processAudioWithEffects(fileId, instructions, effects) {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to process audio');
    }

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/audio/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_id: fileId,
          instructions,
          effects
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Processing with effects error:', error);
      throw error;
    }
  }

  // Get user's uploaded files
  async getUserFiles() {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to view your files');
    }

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/user/files`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }
  }

  // Delete user's file
  async deleteFile(fileId) {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to delete files');
    }

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/user/files/${fileId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        if (response.status === 404) {
          throw new Error('File not found');
        }
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get audio file URL with auth token
  getAudioUrl(fileId) {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return `${this.baseURL}/api/audio/${fileId}`;
  }
  
  // Export audio in different format
  async exportAudio(fileId, format, quality = 'high') {
    if (!authService.isAuthenticated()) {
      throw new Error('Please sign in to export audio');
    }

    try {
      const headers = await this.getAuthHeaders();
      
      // Remove content-type so browser can set it with boundary for FormData
      delete headers['Content-Type'];
      
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('format', format);
      formData.append('quality', quality);
      
      const response = await fetch(`${this.baseURL}/api/audio/export`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
  
  // Get supported export formats
  async getSupportedFormats() {
    try {
      const response = await fetch(`${this.baseURL}/api/audio/formats`);
      
      if (!response.ok) {
        throw new Error(`Failed to get formats: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting formats:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateAudioFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/m4a'
    ];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a valid audio file (WAV, MP3, OGG, FLAC, AAC, M4A)');
    }

    return true;
  }
}

// Create singleton instance
const uploadService = new UploadService();

export default uploadService;