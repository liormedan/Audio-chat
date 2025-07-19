import React from 'react';
import './VoiceSelector.css';

const AVAILABLE_VOICES = [
  { id: 'default', name: 'Default', gender: 'neutral', accent: 'American' },
  { id: 'alloy', name: 'Alloy', gender: 'neutral', accent: 'American' },
  { id: 'echo', name: 'Echo', gender: 'male', accent: 'American' },
  { id: 'fable', name: 'Fable', gender: 'female', accent: 'British' },
  { id: 'onyx', name: 'Onyx', gender: 'male', accent: 'British' },
  { id: 'nova', name: 'Nova', gender: 'female', accent: 'American' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', accent: 'American' }
];

function VoiceSelector({ selectedVoice, onSelectVoice }) {
  return (
    <div className="voice-selector">
      <h4>Text-to-Speech Voice</h4>
      <div className="voice-options">
        {AVAILABLE_VOICES.map(voice => (
          <div 
            key={voice.id} 
            className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''}`}
            onClick={() => onSelectVoice(voice.id)}
          >
            <div className="voice-option-inner">
              <div className="voice-name">{voice.name}</div>
              <div className="voice-details">
                {voice.gender} • {voice.accent}
              </div>
              {selectedVoice === voice.id && (
                <div className="voice-selected-indicator">✓</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceSelector;