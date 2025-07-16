import React, { useState, useRef, useEffect } from 'react';
import AudioWaveform from './AudioWaveform';
import './AudioPlayer.css';

function AudioPlayer({ audioUrl, waveformData, isProcessed = false, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleDurationChange = () => {
        setDuration(audio.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef]);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className={`audio-player ${isProcessed ? 'processed' : 'original'}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="player-header">
        <div className="player-title">
          {title || (isProcessed ? 'Processed Audio' : 'Original Audio')}
        </div>
        <div className="player-badge">
          {isProcessed ? 'Processed' : 'Original'}
        </div>
      </div>
      
      <AudioWaveform 
        waveformData={waveformData} 
        isProcessed={isProcessed}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
      />
      
      <div className="player-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`} 
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="seek-bar" onClick={handleSeek}>
          <div className="seek-bar-background"></div>
          <div 
            className="seek-bar-progress" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;