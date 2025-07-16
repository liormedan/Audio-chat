import React, { useRef, useEffect } from 'react';
import './AudioVisualizer.css';

function AudioVisualizer({ isRecording, audioStream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;

    const setupAudioAnalyser = async () => {
      if (!audioStream) return;

      // Create audio context
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      
      // Configure analyser
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Connect microphone to analyser
      microphone = audioContext.createMediaStreamSource(audioStream);
      microphone.connect(analyser);
      
      // Start visualization
      drawVisualizer();
    };

    const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current || !isRecording) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Draw visualization
      const barWidth = (width / dataArray.length) * 2.5;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = dataArray[i] / 255 * height / 2;
        
        // Use gradient color based on frequency
        const hue = i / dataArray.length * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        // Draw bar (mirrored)
        ctx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    if (isRecording && audioStream) {
      setupAudioAnalyser();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording, audioStream]);

  return (
    <div className={`audio-visualizer ${isRecording ? 'active' : ''}`}>
      <canvas ref={canvasRef} width="200" height="60" />
    </div>
  );
}

export default AudioVisualizer;