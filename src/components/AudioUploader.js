import React, { useState } from 'react';
import { uploadAudio } from '../services/api';
import './AudioUploader.css';

function AudioUploader({ onAudioUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async (file) => {
    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, etc.)');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Upload the file
      const result = await uploadAudio(file);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component
      onAudioUploaded(result);
      
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Error uploading audio file. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <div 
      className={`audio-uploader ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Uploading... {Math.round(uploadProgress)}%
          </div>
        </div>
      ) : (
        <>
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div className="upload-text">
            <p>Drag and drop an audio file here</p>
            <p>or</p>
            <label className="upload-button">
              Browse Files
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
            </label>
            <p className="upload-formats">Supported formats: MP3, WAV, FLAC, OGG</p>
          </div>
        </>
      )}
    </div>
  );
}

export default AudioUploader;