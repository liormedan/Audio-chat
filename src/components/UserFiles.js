import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import uploadService from '../services/upload';
import './UserFiles.css';

function UserFiles({ onFileSelect }) {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserFiles();
    }
  }, [isAuthenticated]);

  const loadUserFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userFiles = await uploadService.getUserFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await uploadService.deleteFile(fileId);
      setFiles(files.filter(file => file.file_id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error.message);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!isAuthenticated) {
    return (
      <div className="user-files-disabled">
        <p>Please sign in to view your files</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="user-files-loading">
        <div className="loading-spinner"></div>
        <p>Loading your files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-files-error">
        <p>Error loading files: {error}</p>
        <button onClick={loadUserFiles} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="user-files-container">
      <div className="user-files-header">
        <h3>Your Audio Files</h3>
        <button onClick={loadUserFiles} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="no-files">
          <p>No audio files uploaded yet</p>
          <p className="no-files-hint">Upload your first audio file to get started</p>
        </div>
      ) : (
        <div className="files-list">
          {files.map((file) => (
            <div key={file.file_id} className="file-item">
              <div className="file-info">
                <div className="file-name">{file.filename}</div>
                <div className="file-details">
                  <span className="file-duration">
                    ⏱️ {formatDuration(file.duration)}
                  </span>
                  <span className="file-size">
                    📁 {formatFileSize(file.size)}
                  </span>
                  {file.sample_rate && (
                    <span className="file-sample-rate">
                      🎵 {file.sample_rate} Hz
                    </span>
                  )}
                </div>
                {file.uploaded_at && (
                  <div className="file-date">
                    Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="file-actions">
                <button
                  onClick={() => onFileSelect?.(file)}
                  className="select-button"
                  title="Select for processing"
                >
                  Select
                </button>
                <button
                  onClick={() => handleDeleteFile(file.file_id)}
                  className="delete-button"
                  title="Delete file"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserFiles;