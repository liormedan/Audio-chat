import axios from 'axios';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function useAuthenticatedApi() {
  const { token } = useContext(AuthContext);

  const baseURL = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:8000/api';

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const api = axios.create({
    baseURL,
    headers: defaultHeaders,
  });

  const getAudioWaveform = async (fileId, points = 1000) => {
    const response = await api.get(`/audio/${fileId}/waveform?points=${points}`);
    return response.data;
  };

  const processAudio = async (fileId, instructions, effects = []) => {
    const response = await api.post('/audio/process', {
      file_id: fileId,
      instructions,
      effects,
    });
    return response.data;
  };

  const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    const headers = { ...defaultHeaders };
    delete headers['Content-Type'];

    const response = await api.post('/audio/transcribe', formData, { headers });
    return response.data;
  };

  return {
    getAudioWaveform,
    processAudio,
    transcribeAudio,
  };
}
