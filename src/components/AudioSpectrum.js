import React, { useRef, useEffect } from 'react';
import './AudioSpectrum.css';

function AudioSpectrum({ audioUrl, title, isProcessed }) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const audioRef = useRef(new Audio());

  // Initialize audio context and analyzer
  useEffect(() => {
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
    analyserRef.current.fftSize = 2048;
    analyserRef.current.smoothingTimeConstant = 0.8;

    // Set up audio element
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.src = audioUrl;
    audioRef.current.volume = 0;  // Muted for visualization only

    // Connect audio to analyzer
    audioRef.current.addEventListener('canplay', () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Start playing and visualizing
      audioRef.current.play();
      drawSpectrum();
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

  // Draw spectrum visualization
  const drawSpectrum = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = isProcessed ? 'rgba(16, 163, 127, 0.1)' : 'rgba(45, 55, 72, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 15);

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);

    // Draw spectrum
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    // Only use the first third of the frequency data (more relevant for audio)
    const usableLength = Math.floor(bufferLength / 3);
    
    for (let i = 0; i < usableLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8;
      
      // Calculate color based on frequency
      let r, g, b;
      if (isProcessed) {
        // Green-blue gradient for processed audio
        r = 16 + (dataArray[i] / 10);
        g = 163 - (dataArray[i] / 5);
        b = 127 + (dataArray[i] / 5);
      } else {
        // Blue-purple gradient for original audio
        r = 45 + (dataArray[i] / 5);
        g = 55 + (dataArray[i] / 10);
        b = 200 - (dataArray[i] / 10);
      }
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(drawSpectrum);
  };

  return (
    <div className="audio-spectrum">
      <canvas ref={canvasRef} width="300" height="150"></canvas>
    </div>
  );
}

export default AudioSpectrum;