// Authenticated API service
import axios from 'axios';
import authService from './auth';

// Create an authenticated API instance
const createAuthenticatedApi = async () => {
  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:8000/api';
  
  let headers = {
    'Content-Type': 'application/json',
  };

  // Add authentication token if available
  if (authService.isAuthenticated()) {
    try {
      const user = authService.getCurrentUser();
      
      // For Firebase
      if (user.getIdToken) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } 
      // For Supabase
      else if (user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
      // For Google OAuth direct
      else if (user.id_token) {
        headers['Authorization'] = `Bearer ${user.id_token}`;
      }
      // For development
      else if (process.env.NODE_ENV === 'development') {
        headers['Authorization'] = 'Bearer dev_test_token';
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  return axios.create({
    baseURL,
    headers
  });
};

// Authenticated API functions
export const getAudioWaveform = async (fileId, points = 1000) => {
  try {
    const api = await createAuthenticatedApi();
    const response = await api.get(`/audio/${fileId}/waveform?points=${points}`);
    return response.data;
  } catch (error) {
    console.error('Error getting audio waveform:', error);
    throw error;
  }
};

export const processAudio = async (fileId, instructions, effects = []) => {
  try {
    const api = await createAuthenticatedApi();
    const response = await api.post('/audio/process', {
      file_id: fileId,
      instructions,
      effects
    });
    return response.data;
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
};

export const transcribeAudio = async (audioBlob) => {
  try {
    const api = await createAuthenticatedApi();
    
    // Remove content-type so axios can set it with boundary for FormData
    delete api.defaults.headers['Content-Type'];
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    const response = await api.post('/audio/transcribe', formData);
    return response.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

export default {
  getAudioWaveform,
  processAudio,
  transcribeAudio
};