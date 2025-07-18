import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import './AudioEditor.css';

function AudioEditor({ audioUrl, onSegmentSelect, onExportClick }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const timelineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(50);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [volume, setVolume] = useState(1);
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (!audioUrl) return;
    
    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4a668e',
      progressColor: '#10a37f',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: 150,
      barGap: 2,
      responsive: true,
      normalize: true,
      plugins: [
        RegionsPlugin.create(),
        TimelinePlugin.create({
          container: timelineRef.current
        })
      ]
    });
    
    // Load audio
    wavesurfer.load(audioUrl);
    
    // Set up event listeners
    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      wavesurfer.setVolume(volume);
      
      // Create a default region covering the entire audio
      wavesurfer.regions.clear();
      const region = wavesurfer.regions.add({
        start: 0,
        end: wavesurfer.getDuration(),
        color: 'rgba(16, 163, 127, 0.2)',
        drag: true,
        resize: true
      });
      
      setSelectedRegion({
        start: 0,
        end: wavesurfer.getDuration()
      });
      
      // Notify parent component
      if (onSegmentSelect) {
        onSegmentSelect({
          start: 0,
          end: wavesurfer.getDuration()
        });
      }
    });
    
    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });
    
    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });
    
    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });
    
    wavesurfer.on('region-update-end', (region) => {
      const newRegion = {
        start: region.start,
        end: region.end
      };
      setSelectedRegion(newRegion);
      
      // Notify parent component
      if (onSegmentSelect) {
        onSegmentSelect(newRegion);
      }
    });
    
    // Save reference
    wavesurferRef.current = wavesurfer;
    
    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };
  
  // Handle zoom change
  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Select entire audio
  const selectAll = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.regions.clear();
      const region = wavesurferRef.current.regions.add({
        start: 0,
        end: duration,
        color: 'rgba(16, 163, 127, 0.2)',
        drag: true,
        resize: true
      });
      
      setSelectedRegion({
        start: 0,
        end: duration
      });
      
      // Notify parent component
      if (onSegmentSelect) {
        onSegmentSelect({
          start: 0,
          end: duration
        });
      }
    }
  };
  
  // Handle export button click
  const handleExportClick = () => {
    if (onExportClick && selectedRegion) {
      onExportClick(selectedRegion);
    }
  };
  
  return (
    <div className="audio-editor">
      <div className="editor-controls">
        <div className="playback-controls">
          <button
            className="play-button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause playback' : 'Play selection'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span className="time-separator">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="editor-actions">
          <button 
            className="select-all-button"
            onClick={selectAll}
          >
            Select All
          </button>
          <button 
            className="export-button"
            onClick={handleExportClick}
          >
            Export Selection
          </button>
        </div>
      </div>
      
      <div className="waveform-container">
        <div ref={waveformRef} className="waveform"></div>
        <div ref={timelineRef} className="timeline"></div>
      </div>
      
      <div className="editor-settings">
        <div className="zoom-control">
          <label>Zoom:</label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={zoom} 
            onChange={handleZoomChange}
          />
        </div>
        
        <div className="volume-control">
          <label>Volume:</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={handleVolumeChange}
          />
        </div>
      </div>
      
      {selectedRegion && (
        <div className="region-info">
          <div className="region-time">
            <span>Start: {formatTime(selectedRegion.start)}</span>
            <span>End: {formatTime(selectedRegion.end)}</span>
            <span>Duration: {formatTime(selectedRegion.end - selectedRegion.start)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioEditor;