import React, { useEffect, useRef, useState } from 'react';
import './SpectrumAnalyzer.css';

function SpectrumAnalyzer({ audioUrl, colorMode = 'rainbow' }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fftSize, setFftSize] = useState(2048);
  const [smoothing, setSmoothing] = useState(0.8);
  const [minDecibels, setMinDecibels] = useState(-100);
  const [maxDecibels, setMaxDecibels] = useState(-30);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioUrl) return;
    
    // Clean up previous audio context if it exists
    if (audioContextRef.current) {
      cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // Create new audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = fftSize;
    analyserRef.current.smoothingTimeConstant = smoothing;
    analyserRef.current.minDecibels = minDecibels;
    analyserRef.current.maxDecibels = maxDecibels;
    
    // Set up audio element
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.src = audioUrl;
    
    // Connect audio to analyzer when it's ready
    audioRef.current.addEventListener('canplay', () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    });
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, [audioUrl]);
  
  // Update analyzer settings when they change
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
      analyserRef.current.minDecibels = minDecibels;
      analyserRef.current.maxDecibels = maxDecibels;
    }
  }, [fftSize, smoothing, minDecibels, maxDecibels]);
  
  // Draw spectrum visualization
  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const drawSpectrum = () => {
      if (!analyserRef.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Draw frequency labels
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      
      const frequencyLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      frequencyLabels.forEach(freq => {
        // Convert frequency to x position
        const nyquist = audioContextRef.current.sampleRate / 2;
        const x = (freq / nyquist) * width;
        
        if (x < width) {
          ctx.fillText(freq >= 1000 ? `${freq/1000}k` : freq, x, height - 5);
          
          // Draw vertical grid line
          ctx.strokeStyle = '#333';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height - 15);
          ctx.stroke();
        }
      });
      
      // Draw spectrum
      const barWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height - 20);
        
        // Calculate color based on frequency and amplitude
        let color;
        if (colorMode === 'rainbow') {
          // Rainbow gradient based on frequency
          const hue = (i / bufferLength) * 360;
          const saturation = 80 + (dataArray[i] / 255) * 20;
          const lightness = 30 + (dataArray[i] / 255) * 20;
          color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else if (colorMode === 'heat') {
          // Heat map (blue to red)
          const intensity = dataArray[i] / 255;
          const r = Math.floor(intensity * 255);
          const g = Math.floor(intensity * 100);
          const b = Math.floor(255 - intensity * 255);
          color = `rgb(${r}, ${g}, ${b})`;
        } else {
          // Default green
          const intensity = dataArray[i] / 255;
          color = `rgb(0, ${Math.floor(intensity * 255)}, ${Math.floor(intensity * 100)})`;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, height - 20 - barHeight, barWidth, barHeight);
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(drawSpectrum);
    };
    
    if (isPlaying) {
      drawSpectrum();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, colorMode]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      // Resume audio context if it's suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  // Handle FFT size change
  const handleFftSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setFftSize(size);
  };
  
  // Handle smoothing change
  const handleSmoothingChange = (e) => {
    const value = parseFloat(e.target.value);
    setSmoothing(value);
  };
  
  // Handle decibel range change
  const handleMinDecibelsChange = (e) => {
    const value = parseInt(e.target.value);
    setMinDecibels(value);
  };
  
  const handleMaxDecibelsChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxDecibels(value);
  };
  
  return (
    <div className="spectrum-analyzer">
      <div className="analyzer-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <div className="analyzer-settings">
          <div className="setting">
            <label>Resolution:</label>
            <select value={fftSize} onChange={handleFftSizeChange}>
              <option value={256}>Very Low (256)</option>
              <option value={512}>Low (512)</option>
              <option value={1024}>Medium (1024)</option>
              <option value={2048}>High (2048)</option>
              <option value={4096}>Very High (4096)</option>
              <option value={8192}>Ultra (8192)</option>
            </select>
          </div>
          
          <div className="setting">
            <label>Smoothing:</label>
            <input 
              type="range" 
              min="0" 
              max="0.95" 
              step="0.05" 
              value={smoothing} 
              onChange={handleSmoothingChange}
            />
            <span>{smoothing.toFixed(2)}</span>
          </div>
          
          <div className="setting">
            <label>Min dB:</label>
            <input 
              type="range" 
              min="-120" 
              max="-60" 
              step="5" 
              value={minDecibels} 
              onChange={handleMinDecibelsChange}
            />
            <span>{minDecibels} dB</span>
          </div>
          
          <div className="setting">
            <label>Max dB:</label>
            <input 
              type="range" 
              min="-50" 
              max="-10" 
              step="5" 
              value={maxDecibels} 
              onChange={handleMaxDecibelsChange}
            />
            <span>{maxDecibels} dB</span>
          </div>
        </div>
      </div>
      
      <div className="analyzer-display">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={300}
          className="spectrum-canvas"
        />
      </div>
    </div>
  );
}

export default SpectrumAnalyzer;