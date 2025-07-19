"""
Basic Effects Extension for AudioChat
Provides simple audio effects like gain, fade in/out, and basic filtering
"""

import numpy as np
from scipy import signal

# Define capabilities
CAPABILITIES = ["gain_adjustment", "fade_effects", "basic_filtering"]

def process_audio(audio_data, sample_rate, audio_analysis=None):
    """
    Process audio with basic effects
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        audio_analysis: Optional audio analysis data
        
    Returns:
        Processed audio data
    """
    # Apply subtle enhancement based on audio analysis
    if audio_analysis:
        # If audio is too quiet, apply gentle gain
        if audio_analysis.get('peak_level', 1.0) < 0.3:
            audio_data = apply_gain(audio_data, gain_db=3.0)
        
        # If audio has harsh frequencies, apply gentle low-pass filter
        if audio_analysis.get('spectral_centroid', 0) > 4000:
            audio_data = apply_lowpass_filter(audio_data, sample_rate, cutoff=8000)
    
    return audio_data

def apply_gain(audio_data, gain_db):
    """
    Apply gain to audio data
    
    Args:
        audio_data: Input audio
        gain_db: Gain in decibels
        
    Returns:
        Audio with applied gain
    """
    gain_linear = 10 ** (gain_db / 20)
    return audio_data * gain_linear

def apply_fade_in(audio_data, sample_rate, duration_seconds=1.0):
    """
    Apply fade in effect
    
    Args:
        audio_data: Input audio
        sample_rate: Sample rate
        duration_seconds: Fade duration in seconds
        
    Returns:
        Audio with fade in applied
    """
    fade_samples = int(duration_seconds * sample_rate)
    fade_samples = min(fade_samples, len(audio_data))
    
    fade_curve = np.linspace(0, 1, fade_samples)
    audio_data[:fade_samples] *= fade_curve
    
    return audio_data

def apply_fade_out(audio_data, sample_rate, duration_seconds=1.0):
    """
    Apply fade out effect
    
    Args:
        audio_data: Input audio
        sample_rate: Sample rate
        duration_seconds: Fade duration in seconds
        
    Returns:
        Audio with fade out applied
    """
    fade_samples = int(duration_seconds * sample_rate)
    fade_samples = min(fade_samples, len(audio_data))
    
    fade_curve = np.linspace(1, 0, fade_samples)
    audio_data[-fade_samples:] *= fade_curve
    
    return audio_data

def apply_lowpass_filter(audio_data, sample_rate, cutoff=5000):
    """
    Apply low-pass filter
    
    Args:
        audio_data: Input audio
        sample_rate: Sample rate
        cutoff: Cutoff frequency in Hz
        
    Returns:
        Filtered audio
    """
    nyquist = sample_rate / 2
    normalized_cutoff = cutoff / nyquist
    
    # Design butterworth filter
    b, a = signal.butter(4, normalized_cutoff, btype='low')
    
    # Apply filter
    filtered_audio = signal.filtfilt(b, a, audio_data)
    
    return filtered_audio