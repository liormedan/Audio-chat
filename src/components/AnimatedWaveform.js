import React, { useRef, useEffect, useState } from 'react';
import './AnimatedWaveform.css';

function AnimatedWaveform({ audioUrl, isPlaying, color = '#10a37f' }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(new Audio());
  const animationRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [dataArray, setDataArray] = useState(null);
  const [source, setSource] = useState(null);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioUrl) return;
    
    // Clean up previous audio context
    if (source) {
      source.disconnect();
    }
    if (audioContext) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Create new audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const newAudioContext = new AudioContext();
    const newAnalyser = newAudioContext.createAnalyser();
    newAnalyser.fftSize = 256;
    const bufferLength = newAnalyser.frequencyBinCount;
    const newDataArray = new Uint8Array(bufferLength);
    
    // Set up audio element
    audioRef.current.src = audioUrl;
    audioRef.current.crossOrigin = "anonymous";
    
    // Connect audio to analyzer when it's ready
    audioRef.current.addEventListener('canplay', () => {
      const newSource = newAudioContext.createMediaElementSource(audioRef.current);
      newSource.connect(newAnalyser);
      newAnalyser.connect(newAudioContext.destination);
      
      setSource(newSource);
    });
    
    // Update state
    setAudioContext(newAudioContext);
    setAnalyser(newAnalyser);
    setDataArray(newDataArray);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (source) {
        source.disconnect();
      }
      if (newAudioContext.state !== 'closed') {
        newAudioContext.close();
      }
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, [audioUrl]);
  
  // Handle play/pause
  useEffect(() => {
    if (!audioContext || !analyser || !dataArray) return;
    
    if (isPlaying) {
      // Resume audio context if it's suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Play audio
      audioRef.current.play();
      
      // Start animation
      const animate = () => {
        analyser.getByteTimeDomainData(dataArray);
        drawWaveform();
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } else {
      // Pause audio
      audioRef.current.pause();
      
      // Stop animation
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, audioContext, analyser, dataArray]);
  
  // Draw waveform
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    const sliceWidth = width / dataArray.length;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw center line
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };
  
  return (
    <div className="animated-waveform">
      <canvas ref={canvasRef} width={800} height={100} />
    </div>
  );
}

export default AnimatedWaveform;