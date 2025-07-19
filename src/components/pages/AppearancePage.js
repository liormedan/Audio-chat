import React from 'react';
import VoiceSelector from '../VoiceSelector';
import { useSettings } from '../../context/SettingsContext';
import './Pages.css';

function AppearancePage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  
  return (
    <div className="settings-page">
      <div className="settings-section">
        <h4>Theme</h4>
        <div className="theme-options">
          <div className="theme-option">
            <input 
              type="radio" 
              id="theme-dark" 
              name="theme" 
              value="dark" 
              defaultChecked 
            />
            <label htmlFor="theme-dark" className="theme-label dark">
              <div className="theme-preview dark-preview"></div>
              <span>Dark</span>
            </label>
          </div>
          
          <div className="theme-option">
            <input 
              type="radio" 
              id="theme-light" 
              name="theme" 
              value="light" 
            />
            <label htmlFor="theme-light" className="theme-label light">
              <div className="theme-preview light-preview"></div>
              <span>Light</span>
            </label>
          </div>
          
          <div className="theme-option">
            <input 
              type="radio" 
              id="theme-system" 
              name="theme" 
              value="system" 
            />
            <label htmlFor="theme-system" className="theme-label system">
              <div className="theme-preview system-preview"></div>
              <span>System</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Font Size</h4>
        <div className="font-size-slider">
          <span className="font-size-label small">A</span>
          <input 
            type="range" 
            min="12" 
            max="20" 
            defaultValue="16" 
            className="slider" 
            id="font-size-slider" 
          />
          <span className="font-size-label large">A</span>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Message Density</h4>
        <div className="radio-options">
          <div className="radio-option">
            <input 
              type="radio" 
              id="density-compact" 
              name="density" 
              value="compact" 
            />
            <label htmlFor="density-compact">Compact</label>
          </div>
          
          <div className="radio-option">
            <input 
              type="radio" 
              id="density-normal" 
              name="density" 
              value="normal" 
              defaultChecked 
            />
            <label htmlFor="density-normal">Normal</label>
          </div>
          
          <div className="radio-option">
            <input 
              type="radio" 
              id="density-spacious" 
              name="density" 
              value="spacious" 
            />
            <label htmlFor="density-spacious">Spacious</label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Code Display</h4>
        <div className="checkbox-options">
          <div className="checkbox-option">
            <input 
              type="checkbox" 
              id="code-syntax-highlighting" 
              defaultChecked 
            />
            <label htmlFor="code-syntax-highlighting">Syntax highlighting</label>
          </div>
          
          <div className="checkbox-option">
            <input 
              type="checkbox" 
              id="code-line-numbers" 
              defaultChecked 
            />
            <label htmlFor="code-line-numbers">Line numbers</label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Audio Settings</h4>
        <div className="checkbox-options">
          <div className="checkbox-option">
            <input 
              type="checkbox" 
              id="auto-play-audio" 
              checked={settings.autoPlayAudio}
              onChange={(e) => updateSetting('autoPlayAudio', e.target.checked)}
            />
            <label htmlFor="auto-play-audio">Auto-play audio responses</label>
          </div>
        </div>
      </div>
      
      <VoiceSelector 
        selectedVoice={settings.selectedVoice} 
        onSelectVoice={(voice) => updateSetting('selectedVoice', voice)} 
      />
      
      <div className="settings-actions">
        <button className="settings-button primary">Save Changes</button>
        <button className="settings-button secondary">Reset to Default</button>
      </div>
    </div>
  );
}

export default AppearancePage;