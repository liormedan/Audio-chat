import React, { useRef, useEffect } from 'react';
import './AudioWaveform.css';

function AudioWaveform({ waveformData, isProcessed = false, isPlaying = false, currentTime = 0, duration = 0 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!waveformData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    const barWidth = width / waveformData.length;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barWidth;
      const y = (1 - Math.abs(waveformData[i])) * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    for (let i = waveformData.length - 1; i >= 0; i--) {
      const x = i * barWidth;
      const y = (1 + Math.abs(waveformData[i])) * height / 2;
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isProcessed) {
      gradient.addColorStop(0, 'rgba(16, 163, 127, 0.6)');
      gradient.addColorStop(1, 'rgba(16, 163, 127, 0.2)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 123, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 123, 255, 0.2)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw playhead if playing
    if (isPlaying && duration > 0) {
      const playheadX = (currentTime / duration) * width;
      
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveformData, isProcessed, isPlaying, currentTime, duration]);
  
  return (
    <div className={`audio-waveform ${isProcessed ? 'processed' : 'original'}`}>
      <canvas ref={canvasRef} width="800" height="150" />
    </div>
  );
}

export default AudioWaveform;