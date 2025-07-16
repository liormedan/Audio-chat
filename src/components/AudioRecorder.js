import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/api';
import AudioVisualizer from './AudioVisualizer';
import './AudioRecorder.css';

function AudioRecorder({ onAudioRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setIsProcessing(true);
        
        try {
          // Send the audio to our backend API for transcription
          const result = await transcribeAudio(audioBlob);
          onAudioRecorded(result.text, audioBlob);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          onAudioRecorded("Sorry, there was an error transcribing your audio.", audioBlob);
        } finally {
          setIsProcessing(false);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Stop timer
      clearInterval(timerRef.current);
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Stop timer
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="audio-recorder">
      {isProcessing ? (
        <div className="processing-indicator">
          <div className="processing-spinner"></div>
          <span>Processing audio...</span>
        </div>
      ) : isRecording ? (
        <div className="recording-controls">
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
          <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />
          <div className="recording-buttons">
            <button 
              className="recording-button cancel" 
              onClick={cancelRecording}
              title="Cancel recording"
            >
              ✕
            </button>
            <button 
              className="recording-button stop" 
              onClick={stopRecording}
              title="Stop recording"
            >
              ■
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="mic-button" 
          onClick={startRecording}
          title="Start voice recording"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
      )}
    </div>
  );
}

export default AudioRecorder;