import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import UserFiles from './UserFiles';
import AudioPlayer from './AudioPlayer';
import ProcessingHistory from './ProcessingHistory';
import AudioComparison from './AudioComparison';
import ParameterAdjuster from './ParameterAdjuster';
import { useAuth } from '../context/AuthContext';
import uploadService from '../services/upload';
import { getAudioWaveform } from '../services/authenticatedApi';
import processingHistoryService from '../services/processingHistory';
import './AudioProcessingInterface.css';

function AudioProcessingInterface() {
  const { isAuthenticated } = useAuth();
  const [originalAudio, setOriginalAudio] = useState(null);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingInstructions, setProcessingInstructions] = useState('');
  const [processingSteps, setProcessingSteps] = useState([]);
  const [originalWaveform, setOriginalWaveform] = useState(null);
  const [processedWaveform, setProcessedWaveform] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
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
  
  const handleUploadComplete = (audioData) => {
    setOriginalAudio(audioData);
    setProcessedAudio(null);
    setProcessingSteps([]);
    setUploadError(null);
  };

  const handleUploadError = (error) => {
    setUploadError(error);
  };

  const handleFileSelect = (file) => {
    setOriginalAudio(file);
    setProcessedAudio(null);
    setProcessingSteps([]);
    setUploadError(null);
  };
  
  const handleProcessAudio = async (customEffects = null) => {
    if (!originalAudio || (!processingInstructions.trim() && !customEffects)) return;
    
    setIsProcessing(true);
    
    try {
      let result;
      
      if (customEffects) {
        // Process with custom effects parameters
        result = await uploadService.processAudioWithEffects(
          originalAudio.file_id,
          processingInstructions,
          customEffects
        );
      } else {
        // Process with natural language instructions
        result = await uploadService.processAudio(
          originalAudio.file_id,
          processingInstructions
        );
      }
      
      setProcessedAudio(result);
      setProcessingSteps(result.processing_steps || []);
      
      // Save to processing history
      processingHistoryService.addProcessingEntry(originalAudio.file_id, result);
    } catch (error) {
      console.error('Error processing audio:', error);
      setUploadError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="audio-processing-interface">
        <div className="auth-required">
          <h3>Authentication Required</h3>
          <p>Please sign in to upload and process audio files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-processing-interface">
      {uploadError && (
        <div className="error-message">
          <p>❌ {uploadError}</p>
          <button onClick={() => setUploadError(null)}>Dismiss</button>
        </div>
      )}

      {!originalAudio ? (
        <div className="upload-section">
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
          <UserFiles onFileSelect={handleFileSelect} />
        </div>
      ) : (
        <>
          <div className="audio-section">
            <div className="section-header">
              <h3>Audio Files</h3>
              <div className="section-actions">
                <button 
                  className={`history-toggle-button ${showHistory ? 'active' : ''}`}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>
            </div>
            
            <div className="audio-players">
              <AudioPlayer 
                audioUrl={uploadService.getAudioUrl(originalAudio.file_id)}
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
            
            {showHistory && (
              <ProcessingHistory 
                originalFileId={originalAudio.file_id}
                onSelectHistoryEntry={(entry) => {
                  // Load the selected processing result
                  setProcessedAudio({
                    processed_file_id: entry.processedFileId,
                    audio_url: entry.audioUrl,
                    processing_steps: entry.processingSteps,
                    audio_analysis: entry.audioAnalysis
                  });
                  setProcessingSteps(entry.processingSteps);
                  setProcessingInstructions(entry.instructions);
                  
                  // Load the waveform data
                  loadWaveformData(entry.processedFileId, true);
                }}
              />
            )}
            
            <div className="audio-actions">
              <button 
                className="new-audio-button"
                onClick={() => setOriginalAudio(null)}
              >
                Upload New Audio
              </button>
            </div>
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
                <div className="processing-suggestions">
                  <h5>Try asking for:</h5>
                  <div className="suggestion-categories">
                    <div className="suggestion-category">
                      <h6>Equalization</h6>
                      <ul>
                        <li onClick={() => setProcessingInstructions("Boost the bass to make it more powerful")}>Boost the bass</li>
                        <li onClick={() => setProcessingInstructions("Add more treble to make it brighter")}>Add more treble</li>
                        <li onClick={() => setProcessingInstructions("Make it sound warmer with a subtle bass boost and treble reduction")}>Make it sound warmer</li>
                      </ul>
                    </div>
                    <div className="suggestion-category">
                      <h6>Dynamics</h6>
                      <ul>
                        <li onClick={() => setProcessingInstructions("Add compression to make it sound more consistent and punchy")}>Add compression</li>
                        <li onClick={() => setProcessingInstructions("Make it louder while preserving dynamics")}>Make it louder</li>
                        <li onClick={() => setProcessingInstructions("Remove background noise while preserving the main audio")}>Remove background noise</li>
                      </ul>
                    </div>
                    <div className="suggestion-category">
                      <h6>Effects</h6>
                      <ul>
                        <li onClick={() => setProcessingInstructions("Add reverb to create a sense of space")}>Add reverb</li>
                        <li onClick={() => setProcessingInstructions("Add a subtle delay/echo effect")}>Add delay/echo</li>
                        <li onClick={() => setProcessingInstructions("Make it sound like it's playing on an old radio")}>Make it sound like a radio</li>
                      </ul>
                    </div>
                    <div className="suggestion-category">
                      <h6>Creative</h6>
                      <ul>
                        <li onClick={() => setProcessingInstructions("Make it sound vintage with some subtle distortion and EQ")}>Make it sound vintage</li>
                        <li onClick={() => setProcessingInstructions("Change the pitch up by 2 semitones")}>Change the pitch</li>
                        <li onClick={() => setProcessingInstructions("Widen the stereo image to make it sound more immersive")}>Widen the stereo image</li>
                      </ul>
                    </div>
                  </div>
                </div>
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
                
                {processedAudio.audio_analysis && (
                  <div className="audio-analysis">
                    <h4>Audio Analysis</h4>
                    <div className="analysis-grid">
                      {processedAudio.audio_analysis.estimated_key && (
                        <div className="analysis-item">
                          <div className="label">Key</div>
                          <div className="value">{processedAudio.audio_analysis.estimated_key}</div>
                        </div>
                      )}
                      
                      {processedAudio.audio_analysis.estimated_tempo && (
                        <div className="analysis-item">
                          <div className="label">Tempo</div>
                          <div className="value">
                            {Math.round(processedAudio.audio_analysis.estimated_tempo)}
                            <span className="unit">BPM</span>
                          </div>
                        </div>
                      )}
                      
                      {processedAudio.audio_analysis.peak_level && (
                        <div className="analysis-item">
                          <div className="label">Peak Level</div>
                          <div className="value">
                            {Math.round(processedAudio.audio_analysis.peak_level * 100)}
                            <span className="unit">%</span>
                          </div>
                        </div>
                      )}
                      
                      {processedAudio.audio_analysis.is_clipping !== undefined && (
                        <div className="analysis-item">
                          <div className="label">Clipping</div>
                          <div className="value" style={{ color: processedAudio.audio_analysis.is_clipping ? '#ff4d4d' : '#4dff4d' }}>
                            {processedAudio.audio_analysis.is_clipping ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="processing-actions">
                  <button 
                    className="save-button"
                    onClick={() => {
                      // Download the processed audio
                      const link = document.createElement('a');
                      link.href = processedAudio.audio_url;
                      link.download = `processed_${originalAudio.filename}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Download Processed Audio
                  </button>
                  
                  <button 
                    className="new-processing-button"
                    onClick={() => {
                      // Clear processing instructions for a new attempt
                      setProcessingInstructions('');
                    }}
                  >
                    Try Different Processing
                  </button>
                </div>
                
                {/* Advanced Audio Comparison */}
                <AudioComparison 
                  originalAudio={{
                    url: uploadService.getAudioUrl(originalAudio.file_id),
                    title: originalAudio.filename
                  }}
                  processedAudio={{
                    url: processedAudio.audio_url,
                    title: "Processed Audio"
                  }}
                />
                
                {/* Parameter Fine-Tuning */}
                <ParameterAdjuster 
                  processingSteps={processingSteps}
                  onParametersChange={(updatedEffects) => {
                    // Re-process the audio with the updated parameters
                    handleProcessAudio(updatedEffects);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AudioProcessingInterface;