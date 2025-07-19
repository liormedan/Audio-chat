import React, { useState } from 'react';
import './AudioAnalysisDisplay.css';

function AudioAnalysisDisplay({ audioAnalysis }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!audioAnalysis) {
    return null;
  }
  
  // Format frequency in Hz or kHz
  const formatFrequency = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    }
    return `${Math.round(freq)} Hz`;
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format dB value
  const formatDB = (db) => {
    return `${db.toFixed(1)} dB`;
  };
  
  // Determine audio quality based on analysis
  const getAudioQuality = () => {
    const { peak_level, crest_factor, spectral_centroid, is_clipping } = audioAnalysis;
    
    if (is_clipping) {
      return { label: 'Poor (Clipping)', color: '#e53e3e' };
    }
    
    if (peak_level < 0.3) {
      return { label: 'Low Level', color: '#ecc94b' };
    }
    
    if (crest_factor < 3) {
      return { label: 'Compressed', color: '#ecc94b' };
    }
    
    if (crest_factor > 15) {
      return { label: 'Very Dynamic', color: '#38a169' };
    }
    
    return { label: 'Good', color: '#38a169' };
  };
  
  // Get harmonic content description
  const getHarmonicContent = () => {
    const { spectral_centroid } = audioAnalysis;
    
    if (spectral_centroid < 1000) {
      return { label: 'Bass Heavy', color: '#3182ce' };
    }
    
    if (spectral_centroid > 4000) {
      return { label: 'Bright', color: '#ecc94b' };
    }
    
    return { label: 'Balanced', color: '#38a169' };
  };
  
  const quality = getAudioQuality();
  const harmonics = getHarmonicContent();
  
  return (
    <div className="audio-analysis-display">
      <div className="analysis-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'spectral' ? 'active' : ''}`}
          onClick={() => setActiveTab('spectral')}
        >
          Spectral
        </button>
        <button 
          className={`tab-button ${activeTab === 'dynamics' ? 'active' : ''}`}
          onClick={() => setActiveTab('dynamics')}
        >
          Dynamics
        </button>
        <button 
          className={`tab-button ${activeTab === 'musical' ? 'active' : ''}`}
          onClick={() => setActiveTab('musical')}
        >
          Musical
        </button>
      </div>
      
      <div className="analysis-content">
        {activeTab === 'overview' && (
          <div className="analysis-overview">
            <div className="analysis-summary">
              <div className="summary-item">
                <div className="summary-label">Quality</div>
                <div className="summary-value" style={{ color: quality.color }}>
                  {quality.label}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Harmonic Content</div>
                <div className="summary-value" style={{ color: harmonics.color }}>
                  {harmonics.label}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Duration</div>
                <div className="summary-value">
                  {formatTime(audioAnalysis.duration)}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Sample Rate</div>
                <div className="summary-value">
                  {audioAnalysis.sample_rate} Hz
                </div>
              </div>
            </div>
            
            <div className="analysis-meters">
              <div className="meter-item">
                <div className="meter-label">Peak Level</div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill" 
                    style={{ 
                      width: `${audioAnalysis.peak_level * 100}%`,
                      backgroundColor: audioAnalysis.is_clipping ? '#e53e3e' : '#3182ce'
                    }}
                  ></div>
                </div>
                <div className="meter-value">
                  {Math.round(audioAnalysis.peak_level * 100)}%
                </div>
              </div>
              
              <div className="meter-item">
                <div className="meter-label">Dynamic Range</div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill" 
                    style={{ 
                      width: `${Math.min(audioAnalysis.crest_factor / 20, 1) * 100}%`,
                      backgroundColor: '#38a169'
                    }}
                  ></div>
                </div>
                <div className="meter-value">
                  {audioAnalysis.crest_factor.toFixed(1)}:1
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'spectral' && (
          <div className="analysis-spectral">
            <div className="spectral-item">
              <div className="spectral-label">Spectral Centroid</div>
              <div className="spectral-value">
                {formatFrequency(audioAnalysis.spectral_centroid)}
              </div>
              <div className="spectral-description">
                Average center of the spectrum (brightness)
              </div>
            </div>
            
            <div className="spectral-item">
              <div className="spectral-label">Spectral Rolloff</div>
              <div className="spectral-value">
                {formatFrequency(audioAnalysis.spectral_rolloff)}
              </div>
              <div className="spectral-description">
                Frequency below which 85% of energy is contained
              </div>
            </div>
            
            <div className="spectral-item">
              <div className="spectral-label">Noise Floor</div>
              <div className="spectral-value">
                {Math.round(audioAnalysis.noise_floor * 100)}%
              </div>
              <div className="spectral-description">
                Estimated background noise level
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'dynamics' && (
          <div className="analysis-dynamics">
            <div className="dynamics-item">
              <div className="dynamics-label">RMS Level</div>
              <div className="dynamics-value">
                {Math.round(audioAnalysis.rms_level * 100)}%
              </div>
              <div className="dynamics-description">
                Average energy level
              </div>
            </div>
            
            <div className="dynamics-item">
              <div className="dynamics-label">Peak Level</div>
              <div className="dynamics-value">
                {Math.round(audioAnalysis.peak_level * 100)}%
              </div>
              <div className="dynamics-description">
                Maximum amplitude
              </div>
            </div>
            
            <div className="dynamics-item">
              <div className="dynamics-label">Crest Factor</div>
              <div className="dynamics-value">
                {audioAnalysis.crest_factor.toFixed(1)}:1
              </div>
              <div className="dynamics-description">
                Peak to RMS ratio (dynamic range)
              </div>
            </div>
            
            <div className="dynamics-item">
              <div className="dynamics-label">Clipping</div>
              <div className="dynamics-value" style={{ color: audioAnalysis.is_clipping ? '#e53e3e' : '#38a169' }}>
                {audioAnalysis.is_clipping ? 'Yes' : 'No'}
              </div>
              <div className="dynamics-description">
                Whether the audio contains clipping
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'musical' && (
          <div className="analysis-musical">
            <div className="musical-item">
              <div className="musical-label">Estimated Key</div>
              <div className="musical-value">
                {audioAnalysis.estimated_key}
              </div>
              <div className="musical-description">
                Detected musical key
              </div>
            </div>
            
            <div className="musical-item">
              <div className="musical-label">Estimated Tempo</div>
              <div className="musical-value">
                {Math.round(audioAnalysis.estimated_tempo)} BPM
              </div>
              <div className="musical-description">
                Detected beats per minute
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioAnalysisDisplay;