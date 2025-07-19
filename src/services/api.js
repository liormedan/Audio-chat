import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const sendChatMessage = async (messages, model) => {
  try {
    const response = await api.post('/chat', {
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1000,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Audio API
export const uploadAudio = async (audioFile) => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const response = await api.post('/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

export const processAudio = async (fileId, instructions, effects = []) => {
  try {
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

export const getAudioWaveform = async (fileId, points = 1000) => {
  try {
    const response = await api.get(`/audio/${fileId}/waveform?points=${points}`);
    return response.data;
  } catch (error) {
    console.error('Error getting audio waveform:', error);
    throw error;
  }
};

export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    const response = await api.post('/audio/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

// API Keys
export const saveApiKey = async (provider, key) => {
  try {
    const formData = new FormData();
    formData.append('provider', provider);
    formData.append('key', key);
    
    const response = await api.post('/keys', formData);
    return response.data;
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
};

export const getApiKey = async (provider) => {
  try {
    const response = await api.get(`/keys/${provider}`);
    return response.data;
  } catch (error) {
    console.error('Error getting API key:', error);
    throw error;
  }
};

// Conversations
export const createConversation = async (title) => {
  try {
    const formData = new FormData();
    formData.append('title', title);
    
    const response = await api.post('/conversations', formData);
    return response.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const listConversations = async () => {
  try {
    const response = await api.get('/conversations');
    return response.data;
  } catch (error) {
    console.error('Error listing conversations:', error);
    throw error;
  }
};

export const getConversation = async (conversationId) => {
  try {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

export default api;