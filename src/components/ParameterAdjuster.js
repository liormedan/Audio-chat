import React, { useState, useEffect } from 'react';
import './ParameterAdjuster.css';

function ParameterAdjuster({ processingSteps, onParametersChange }) {
  const [parameters, setParameters] = useState({});
  const [expandedEffect, setExpandedEffect] = useState(null);

  // Parse processing steps to extract parameters
  useEffect(() => {
    if (!processingSteps || processingSteps.length === 0) return;

    const extractedParams = {};
    
    processingSteps.forEach((step, index) => {
      // Extract effect type from step description
      let effectType = '';
      if (step.toLowerCase().includes('eq')) effectType = 'eq';
      else if (step.toLowerCase().includes('compression')) effectType = 'compression';
      else if (step.toLowerCase().includes('reverb')) effectType = 'reverb';
      else if (step.toLowerCase().includes('delay')) effectType = 'delay';
      else if (step.toLowerCase().includes('noise reduction')) effectType = 'noise_reduction';
      else if (step.toLowerCase().includes('pitch')) effectType = 'pitch_shift';
      else if (step.toLowerCase().includes('stereo width')) effectType = 'stereo_width';
      else if (step.toLowerCase().includes('distortion')) effectType = 'distortion';
      else if (step.toLowerCase().includes('filter')) effectType = 'filter';
      else effectType = `effect_${index}`;
      
      // Extract parameters based on effect type
      const params = {};
      
      if (effectType === 'eq') {
        // Extract EQ parameters
        const bassMatch = step.match(/(\d+)dB (boost|cut) to bass/);
        if (bassMatch) {
          params.low = bassMatch[2] === 'boost' ? parseInt(bassMatch[1]) : -parseInt(bassMatch[1]);
        }
        
        const midMatch = step.match(/(\d+)dB (boost|cut) to mids/);
        if (midMatch) {
          params.mid = midMatch[2] === 'boost' ? parseInt(midMatch[1]) : -parseInt(midMatch[1]);
        }
        
        const trebleMatch = step.match(/(\d+)dB (boost|cut) to treble/);
        if (trebleMatch) {
          params.high = trebleMatch[2] === 'boost' ? parseInt(trebleMatch[1]) : -parseInt(trebleMatch[1]);
        }
      } else if (effectType === 'compression') {
        // Extract compression parameters
        const thresholdMatch = step.match(/([-\d]+)dB threshold/);
        if (thresholdMatch) {
          params.threshold = parseInt(thresholdMatch[1]);
        }
        
        const ratioMatch = step.match(/([\d.]+):1 ratio/);
        if (ratioMatch) {
          params.ratio = parseFloat(ratioMatch[1]);
        }
        
        const attackMatch = step.match(/([\d.]+)ms attack/);
        if (attackMatch) {
          params.attack = parseInt(attackMatch[1]);
        }
        
        const releaseMatch = step.match(/([\d.]+)ms release/);
        if (releaseMatch) {
          params.release = parseInt(releaseMatch[1]);
        }
      } else if (effectType === 'reverb') {
        // Extract reverb parameters
        const roomSizeMatch = step.match(/(\d+)% room size/);
        if (roomSizeMatch) {
          params.room_size = parseInt(roomSizeMatch[1]) / 100;
        }
        
        const wetMatch = step.match(/(\d+)% wet signal/);
        if (wetMatch) {
          params.wet_level = parseInt(wetMatch[1]) / 100;
        }
      } else if (effectType === 'delay') {
        // Extract delay parameters
        const timeMatch = step.match(/(\d+)ms delay time/);
        if (timeMatch) {
          params.time = parseInt(timeMatch[1]) / 1000;
        }
        
        const feedbackMatch = step.match(/(\d+)% feedback/);
        if (feedbackMatch) {
          params.feedback = parseInt(feedbackMatch[1]) / 100;
        }
        
        const mixMatch = step.match(/(\d+)% mix/);
        if (mixMatch) {
          params.mix = parseInt(mixMatch[1]) / 100;
        }
      }
      
      // Add to parameters object
      if (Object.keys(params).length > 0) {
        extractedParams[effectType] = {
          type: effectType,
          parameters: params,
          description: step
        };
      }
    });
    
    setParameters(extractedParams);
    
    // Set first effect as expanded by default
    if (Object.keys(extractedParams).length > 0) {
      setExpandedEffect(Object.keys(extractedParams)[0]);
    }
  }, [processingSteps]);

  // Update parameter value
  const updateParameter = (effectType, paramName, value) => {
    setParameters(prevParams => {
      const updatedParams = {
        ...prevParams,
        [effectType]: {
          ...prevParams[effectType],
          parameters: {
            ...prevParams[effectType].parameters,
            [paramName]: value
          }
        }
      };
      
      // Notify parent component of parameter changes
      if (onParametersChange) {
        const effectsArray = Object.values(updatedParams).map(effect => ({
          type: effect.type,
          parameters: effect.parameters
        }));
        onParametersChange(effectsArray);
      }
      
      return updatedParams;
    });
  };

  // Toggle effect expansion
  const toggleEffect = (effectType) => {
    setExpandedEffect(expandedEffect === effectType ? null : effectType);
  };

  // Render parameter controls based on effect type
  const renderParameterControls = (effectType, params) => {
    switch (effectType) {
      case 'eq':
        return (
          <div className="parameter-controls">
            <div className="parameter-slider">
              <label>Bass</label>
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1" 
                value={params.low || 0} 
                onChange={(e) => updateParameter(effectType, 'low', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.low || 0} dB</span>
            </div>
            
            <div className="parameter-slider">
              <label>Mids</label>
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1" 
                value={params.mid || 0} 
                onChange={(e) => updateParameter(effectType, 'mid', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.mid || 0} dB</span>
            </div>
            
            <div className="parameter-slider">
              <label>Treble</label>
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1" 
                value={params.high || 0} 
                onChange={(e) => updateParameter(effectType, 'high', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.high || 0} dB</span>
            </div>
          </div>
        );
        
      case 'compression':
        return (
          <div className="parameter-controls">
            <div className="parameter-slider">
              <label>Threshold</label>
              <input 
                type="range" 
                min="-60" 
                max="0" 
                step="1" 
                value={params.threshold || -20} 
                onChange={(e) => updateParameter(effectType, 'threshold', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.threshold || -20} dB</span>
            </div>
            
            <div className="parameter-slider">
              <label>Ratio</label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="0.1" 
                value={params.ratio || 4} 
                onChange={(e) => updateParameter(effectType, 'ratio', parseFloat(e.target.value))}
              />
              <span className="parameter-value">{params.ratio || 4}:1</span>
            </div>
            
            <div className="parameter-slider">
              <label>Attack</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1" 
                value={params.attack || 20} 
                onChange={(e) => updateParameter(effectType, 'attack', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.attack || 20} ms</span>
            </div>
            
            <div className="parameter-slider">
              <label>Release</label>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10" 
                value={params.release || 250} 
                onChange={(e) => updateParameter(effectType, 'release', parseInt(e.target.value))}
              />
              <span className="parameter-value">{params.release || 250} ms</span>
            </div>
          </div>
        );
        
      case 'reverb':
        return (
          <div className="parameter-controls">
            <div className="parameter-slider">
              <label>Room Size</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={(params.room_size || 0.5) * 100} 
                onChange={(e) => updateParameter(effectType, 'room_size', parseInt(e.target.value) / 100)}
              />
              <span className="parameter-value">{Math.round((params.room_size || 0.5) * 100)}%</span>
            </div>
            
            <div className="parameter-slider">
              <label>Wet Level</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={(params.wet_level || 0.33) * 100} 
                onChange={(e) => updateParameter(effectType, 'wet_level', parseInt(e.target.value) / 100)}
              />
              <span className="parameter-value">{Math.round((params.wet_level || 0.33) * 100)}%</span>
            </div>
            
            <div className="parameter-slider">
              <label>Damping</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={(params.damping || 0.5) * 100} 
                onChange={(e) => updateParameter(effectType, 'damping', parseInt(e.target.value) / 100)}
              />
              <span className="parameter-value">{Math.round((params.damping || 0.5) * 100)}%</span>
            </div>
          </div>
        );
        
      case 'delay':
        return (
          <div className="parameter-controls">
            <div className="parameter-slider">
              <label>Delay Time</label>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10" 
                value={(params.time || 0.25) * 1000} 
                onChange={(e) => updateParameter(effectType, 'time', parseInt(e.target.value) / 1000)}
              />
              <span className="parameter-value">{Math.round((params.time || 0.25) * 1000)} ms</span>
            </div>
            
            <div className="parameter-slider">
              <label>Feedback</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={(params.feedback || 0.3) * 100} 
                onChange={(e) => updateParameter(effectType, 'feedback', parseInt(e.target.value) / 100)}
              />
              <span className="parameter-value">{Math.round((params.feedback || 0.3) * 100)}%</span>
            </div>
            
            <div className="parameter-slider">
              <label>Mix</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={(params.mix || 0.3) * 100} 
                onChange={(e) => updateParameter(effectType, 'mix', parseInt(e.target.value) / 100)}
              />
              <span className="parameter-value">{Math.round((params.mix || 0.3) * 100)}%</span>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="parameter-controls">
            <p className="no-parameters">No adjustable parameters available for this effect.</p>
          </div>
        );
    }
  };

  if (Object.keys(parameters).length === 0) {
    return null;
  }

  return (
    <div className="parameter-adjuster">
      <h4>Fine-Tune Parameters</h4>
      
      <div className="effects-list">
        {Object.entries(parameters).map(([effectType, effect]) => (
          <div key={effectType} className="effect-item">
            <div 
              className="effect-header"
              onClick={() => toggleEffect(effectType)}
            >
              <div className="effect-title">
                <span className="effect-icon">
                  {expandedEffect === effectType ? '▼' : '►'}
                </span>
                <span className="effect-name">
                  {effectType === 'eq' ? 'Equalizer' : 
                   effectType === 'compression' ? 'Compression' :
                   effectType === 'reverb' ? 'Reverb' :
                   effectType === 'delay' ? 'Delay/Echo' :
                   effectType === 'noise_reduction' ? 'Noise Reduction' :
                   effectType === 'pitch_shift' ? 'Pitch Shift' :
                   effectType === 'stereo_width' ? 'Stereo Width' :
                   effectType === 'distortion' ? 'Distortion' :
                   effectType === 'filter' ? 'Filter' :
                   'Effect'}
                </span>
              </div>
            </div>
            
            {expandedEffect === effectType && (
              <div className="effect-parameters">
                {renderParameterControls(effectType, effect.parameters)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="apply-changes">
        <button 
          className="apply-button"
          onClick={() => {
            if (onParametersChange) {
              const effectsArray = Object.values(parameters).map(effect => ({
                type: effect.type,
                parameters: effect.parameters
              }));
              onParametersChange(effectsArray);
            }
          }}
        >
          Reprocess with These Parameters
        </button>
      </div>
    </div>
  );
}

export default ParameterAdjuster;