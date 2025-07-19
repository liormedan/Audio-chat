import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import uploadService from '../services/upload';
import './FileUpload.css';
import { FaMusic } from 'react-icons/fa';

function FileUpload({ onUploadComplete, onUploadError }) {
  const { isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!isAuthenticated) {
      onUploadError?.('Please sign in to upload files');
      return;
    }

    try {
      // Validate file
      uploadService.validateAudioFile(file);
      
      setIsUploading(true);
      setUploadProgress(0);

      // Upload with progress tracking
      const result = await uploadService.uploadAudio(file, (progress) => {
        setUploadProgress(progress);
      });

      onUploadComplete?.(result);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="file-upload-disabled">
        <p>Please sign in to upload audio files</p>
      </div>
    );
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="upload-progress">
            <div className="upload-spinner"></div>
            <p>Uploading... {uploadProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">
              <FaMusic aria-label="Upload" />
            </div>
            <h3>Upload Audio File</h3>
            <p>Drag and drop your audio file here, or click to browse</p>
            <p className="file-info">Supported formats: WAV, MP3, OGG, FLAC, AAC, M4A (max 50MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;