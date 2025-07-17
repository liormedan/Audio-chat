import React, { useState } from 'react';
import AudioSpectrum from './AudioSpectrum';
import './AudioComparison.css';

function AudioComparison({ originalAudio, processedAudio }) {
  const [comparisonMode, setComparisonMode] = useState('side-by-side'); // 'side-by-side', 'a-b', 'spectrum'
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudio, setActiveAudio] = useState('original'); // 'original' or 'processed'
  
  // Audio elements
  const originalAudioRef = React.useRef(new Audio());
  const processedAudioRef = React.useRef(new Audio());
  
  // Set up audio sources
  React.useEffect(() => {
    if (originalAudio && processedAudio) {
      originalAudioRef.current.src = originalAudio.url;
      processedAudioRef.current.src = processedAudio.url;
      
      // Sync playback positions
      originalAudioRef.current.addEventListener('timeupdate', syncProcessedAudio);
      processedAudioRef.current.addEventListener('timeupdate', syncOriginalAudio);
      
      // Handle playback ending
      originalAudioRef.current.addEventListener('ended', handlePlaybackEnded);
      processedAudioRef.current.addEventListener('ended', handlePlaybackEnded);
    }
    
    return () => {
      // Clean up event listeners
      originalAudioRef.current.removeEventListener('timeupdate', syncProcessedAudio);
      processedAudioRef.current.removeEventListener('timeupdate', syncOriginalAudio);
      originalAudioRef.current.removeEventListener('ended', handlePlaybackEnded);
      processedAudioRef.current.removeEventListener('ended', handlePlaybackEnded);
      
      // Stop playback
      originalAudioRef.current.pause();
      processedAudioRef.current.pause();
    };
  }, [originalAudio, processedAudio]);
  
  // Sync processed audio to original audio position
  const syncProcessedAudio = () => {
    if (Math.abs(processedAudioRef.current.currentTime - originalAudioRef.current.currentTime) > 0.1) {
      processedAudioRef.current.currentTime = originalAudioRef.current.currentTime;
    }
  };
  
  // Sync original audio to processed audio position
  const syncOriginalAudio = () => {
    if (Math.abs(originalAudioRef.current.currentTime - processedAudioRef.current.currentTime) > 0.1) {
      originalAudioRef.current.currentTime = processedAudioRef.current.currentTime;
    }
  };
  
  // Handle playback ending
  const handlePlaybackEnded = () => {
    setIsPlaying(false);
    setActiveAudio('original');
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      originalAudioRef.current.pause();
      processedAudioRef.current.pause();
    } else {
      if (comparisonMode === 'side-by-side') {
        // Play both simultaneously
        originalAudioRef.current.play();
        processedAudioRef.current.play();
      } else if (comparisonMode === 'a-b') {
        // Play only the active one
        if (activeAudio === 'original') {
          originalAudioRef.current.play();
          processedAudioRef.current.pause();
        } else {
          processedAudioRef.current.play();
          originalAudioRef.current.pause();
        }
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  // Switch between original and processed in A/B mode
  const switchAudio = () => {
    if (comparisonMode === 'a-b' && isPlaying) {
      if (activeAudio === 'original') {
        originalAudioRef.current.pause();
        processedAudioRef.current.currentTime = originalAudioRef.current.currentTime;
        processedAudioRef.current.play();
        setActiveAudio('processed');
      } else {
        processedAudioRef.current.pause();
        originalAudioRef.current.currentTime = processedAudioRef.current.currentTime;
        originalAudioRef.current.play();
        setActiveAudio('original');
      }
    } else {
      setActiveAudio(activeAudio === 'original' ? 'processed' : 'original');
    }
  };
  
  // Change comparison mode
  const changeComparisonMode = (mode) => {
    // Stop playback when changing modes
    originalAudioRef.current.pause();
    processedAudioRef.current.pause();
    setIsPlaying(false);
    setComparisonMode(mode);
  };
  
  if (!originalAudio || !processedAudio) {
    return null;
  }
  
  return (
    <div className="audio-comparison">
      <div className="comparison-controls">
        <div className="comparison-modes">
          <button 
            className={`mode-button ${comparisonMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => changeComparisonMode('side-by-side')}
          >
            Side by Side
          </button>
          <button 
            className={`mode-button ${comparisonMode === 'a-b' ? 'active' : ''}`}
            onClick={() => changeComparisonMode('a-b')}
          >
            A/B Comparison
          </button>
          <button 
            className={`mode-button ${comparisonMode === 'spectrum' ? 'active' : ''}`}
            onClick={() => changeComparisonMode('spectrum')}
          >
            Spectrum View
          </button>
        </div>
        
        <div className="playback-controls">
          <button 
            className="play-button"
            onClick={togglePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          {comparisonMode === 'a-b' && (
            <button 
              className="switch-button"
              onClick={switchAudio}
            >
              Switch to {activeAudio === 'original' ? 'Processed' : 'Original'}
            </button>
          )}
        </div>
      </div>
      
      <div className="comparison-view">
        {comparisonMode === 'side-by-side' && (
          <div className="side-by-side-view">
            <div className="audio-column">
              <h5>Original Audio</h5>
              <div className="waveform-container">
                {/* Original waveform visualization would go here */}
              </div>
            </div>
            <div className="audio-column">
              <h5>Processed Audio</h5>
              <div className="waveform-container">
                {/* Processed waveform visualization would go here */}
              </div>
            </div>
          </div>
        )}
        
        {comparisonMode === 'a-b' && (
          <div className="a-b-view">
            <div className="active-indicator">
              Now Playing: <span>{activeAudio === 'original' ? 'Original Audio' : 'Processed Audio'}</span>
            </div>
            <div className="waveform-container">
              {/* Active waveform visualization would go here */}
            </div>
          </div>
        )}
        
        {comparisonMode === 'spectrum' && (
          <div className="spectrum-view">
            <div className="spectrum-container">
              <AudioSpectrum 
                audioUrl={originalAudio.url}
                title="Original Audio Spectrum"
                isProcessed={false}
              />
              <AudioSpectrum 
                audioUrl={processedAudio.url}
                title="Processed Audio Spectrum"
                isProcessed={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioComparison;