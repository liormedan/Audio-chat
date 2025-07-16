import React, { useState, useEffect } from 'react';
import AudioUploader from './AudioUploader';
import AudioPlayer from './AudioPlayer';
import { processAudio, getAudioWaveform } from '../services/api';
import './AudioProcessingInterface.css';

function AudioProcessingInterface() {
  const [originalAudio, setOriginalAudio] = useState(null);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingInstructions, setProcessingInstructions] = useState('');
  const [processingSteps, setProcessingSteps] = useState([]);
  const [originalWaveform, setOriginalWaveform] = useState(null);
  const [processedWaveform, setProcessedWaveform] = useState(null);
  
  // Load waveform data when audio is uploaded
  useEffect(() => {
    if (originalAudio && originalAudio.file_id) {
      loadWaveformData(originalAudio.file_id, false);
    }
  }, [originalAudio]);
  
  useEffect(() => {
    if (processedAudio && processedAudio.processed_file_id) {
      loadWaveformData(processedAudio.processed_file_id, true);
    }
  }, [processedAudio]);
  
  const loadWaveformData = async (fileId, isProcessed) => {
    try {
      const waveformData = await getAudioWaveform(fileId);
      if (isProcessed) {
        setProcessedWaveform(waveformData.waveform);
      } else {
        setOriginalWaveform(waveformData.waveform);
      }
    } catch (error) {
      console.error('Error loading waveform data:', error);
    }
  };
  
  const handleAudioUploaded = (audioData) => {
    setOriginalAudio(audioData);
    setProcessedAudio(null);
    setProcessingSteps([]);
  };
  
  const handleProcessAudio = async () => {
    if (!originalAudio || !processingInstructions.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const result = await processAudio(
        originalAudio.file_id,
        processingInstructions
      );
      
      setProcessedAudio(result);
      setProcessingSteps(result.processing_steps || []);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="audio-processing-interface">
      {!originalAudio ? (
        <AudioUploader onAudioUploaded={handleAudioUploaded} />
      ) : (
        <>
          <div className="audio-section">
            <h3>Audio Files</h3>
            
            <div className="audio-players">
              <AudioPlayer 
                audioUrl={`http://localhost:8000/api/audio/${originalAudio.file_id}`}
                waveformData={originalWaveform}
                title={originalAudio.filename}
                isProcessed={false}
              />
              
              {processedAudio && (
                <AudioPlayer 
                  audioUrl={processedAudio.audio_url}
                  waveformData={processedWaveform}
                  title="Processed Audio"
                  isProcessed={true}
                />
              )}
            </div>
            
            <button 
              className="new-audio-button"
              onClick={() => setOriginalAudio(null)}
            >
              Upload New Audio
            </button>
          </div>
          
          <div className="processing-section">
            <h3>Audio Processing</h3>
            
            <div className="processing-form">
              <div className="form-group">
                <label htmlFor="processing-instructions">
                  Describe the audio changes you want to make:
                </label>
                <textarea 
                  id="processing-instructions"
                  value={processingInstructions}
                  onChange={(e) => setProcessingInstructions(e.target.value)}
                  placeholder="Example: Make the vocals louder and add some reverb to create more space"
                  rows={4}
                  disabled={isProcessing}
                />
              </div>
              
              <button 
                className="process-button"
                onClick={handleProcessAudio}
                disabled={isProcessing || !processingInstructions.trim()}
              >
                {isProcessing ? 'Processing...' : 'Process Audio'}
              </button>
            </div>
            
            {processedAudio && (
              <div className="processing-results">
                <h4>Processing Results</h4>
                
                <div className="processing-steps">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="processing-step">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-description">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AudioProcessingInterface;