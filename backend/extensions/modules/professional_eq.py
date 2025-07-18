"""
Professional EQ Suite Extension for AudioChat

Provides high-quality equalizers with multiple algorithms including
analog-style EQ, digital precision EQ, and vintage character EQ.
"""

import numpy as np
from scipy import signal

# Define capabilities
CAPABILITIES = [
    "analog_eq", 
    "digital_eq",
    "vintage_eq", 
    "auto_eq",
    "dynamic_eq"
]

# EQ presets for different scenarios
EQ_PRESETS = {
    "vocal_presence": [
        {"type": "high_shelf", "freq": 8000, "gain": 2.0, "q": 0.7},
        {"type": "peak", "freq": 3000, "gain": 3.0, "q": 1.0},
        {"type": "peak", "freq": 250, "gain": -2.0, "q": 1.0},
        {"type": "high_pass", "freq": 100, "q": 0.7}
    ],
    "bass_boost": [
        {"type": "low_shelf", "freq": 100, "gain": 4.0, "q": 0.7},
        {"type": "peak", "freq": 60, "gain": 2.0, "q": 1.5},
        {"type": "peak", "freq": 300, "gain": -1.0, "q": 1.0}
    ],
    "air_and_clarity": [
        {"type": "high_shelf", "freq": 10000, "gain": 3.0, "q": 0.7},
        {"type": "peak", "freq": 5000, "gain": 2.0, "q": 1.0},
        {"type": "peak", "freq": 300, "gain": -2.0, "q": 1.0}
    ],
    "warm_and_smooth": [
        {"type": "low_shelf", "freq": 200, "gain": 2.0, "q": 0.7},
        {"type": "high_shelf", "freq": 8000, "gain": -2.0, "q": 0.7},
        {"type": "peak", "freq": 3000, "gain": -1.5, "q": 1.0}
    ],
    "telephone_effect": [
        {"type": "band_pass", "freq_low": 500, "freq_high": 3000, "q": 0.7},
        {"type": "peak", "freq": 1500, "gain": 5.0, "q": 2.0}
    ],
    "mud_reduction": [
        {"type": "peak", "freq": 300, "gain": -3.0, "q": 1.2},
        {"type": "peak", "freq": 500, "gain": -2.0, "q": 1.0}
    ],
    "sibilance_reduction": [
        {"type": "peak", "freq": 6000, "gain": -3.0, "q": 1.5},
        {"type": "peak", "freq": 8000, "gain": -2.0, "q": 1.0}
    ]
}

def process_audio(audio_data, sample_rate, audio_analysis=None):
    """
    Process audio with professional EQ
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        audio_analysis: Optional audio analysis data
        
    Returns:
        Processed audio data
    """
    # Default to a subtle clarity enhancement if no specific instructions
    eq_bands = [
        {"type": "high_shelf", "freq": 8000, "gain": 1.5, "q": 0.7},
        {"type": "peak", "freq": 3000, "gain": 1.0, "q": 1.0},
        {"type": "peak", "freq": 300, "gain": -1.0, "q": 1.0},
        {"type": "high_pass", "freq": 30, "q": 0.7}
    ]
    
    # If we have audio analysis, use it to determine appropriate EQ
    if audio_analysis and "spectrum_analysis" in audio_analysis:
        eq_bands = auto_eq_from_analysis(audio_analysis)
    
    # Apply the EQ
    processed_audio = apply_eq(audio_data, sample_rate, eq_bands, eq_type="digital")
    
    return processed_audio

def apply_eq(audio_data, sample_rate, eq_bands, eq_type="digital"):
    """
    Apply equalizer to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        eq_bands: List of EQ bands to apply
        eq_type: Type of EQ algorithm to use ("digital", "analog", "vintage")
        
    Returns:
        Processed audio data
    """
    processed_audio = audio_data.copy()
    
    for band in eq_bands:
        band_type = band["type"]
        
        if band_type == "peak":
            processed_audio = apply_peak_filter(
                processed_audio, 
                sample_rate, 
                band["freq"], 
                band["gain"], 
                band["q"],
                eq_type
            )
        elif band_type == "low_shelf":
            processed_audio = apply_low_shelf_filter(
                processed_audio, 
                sample_rate, 
                band["freq"], 
                band["gain"], 
                band["q"],
                eq_type
            )
        elif band_type == "high_shelf":
            processed_audio = apply_high_shelf_filter(
                processed_audio, 
                sample_rate, 
                band["freq"], 
                band["gain"], 
                band["q"],
                eq_type
            )
        elif band_type == "high_pass":
            processed_audio = apply_high_pass_filter(
                processed_audio, 
                sample_rate, 
                band["freq"], 
                band["q"],
                eq_type
            )
        elif band_type == "low_pass":
            processed_audio = apply_low_pass_filter(
                processed_audio, 
                sample_rate, 
                band["freq"], 
                band["q"],
                eq_type
            )
        elif band_type == "band_pass":
            processed_audio = apply_band_pass_filter(
                processed_audio, 
                sample_rate, 
                band["freq_low"],
                band["freq_high"],
                band["q"],
                eq_type
            )
    
    return processed_audio

def apply_peak_filter(audio_data, sample_rate, freq, gain, q, eq_type="digital"):
    """
    Apply peak filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq: Center frequency in Hz
        gain: Gain in dB
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Convert gain from dB to linear
    gain_linear = 10 ** (gain / 20)
    
    # Normalize frequency
    w0 = 2 * np.pi * freq / sample_rate
    
    # Calculate filter coefficients
    if eq_type == "digital":
        # Digital biquad filter
        alpha = np.sin(w0) / (2 * q)
        
        if gain >= 0:
            # Boost
            a0 = 1 + alpha / gain_linear
            a1 = -2 * np.cos(w0)
            a2 = 1 - alpha / gain_linear
            b0 = 1 + alpha * gain_linear
            b1 = -2 * np.cos(w0)
            b2 = 1 - alpha * gain_linear
        else:
            # Cut
            a0 = 1 + alpha * gain_linear
            a1 = -2 * np.cos(w0)
            a2 = 1 - alpha * gain_linear
            b0 = 1 + alpha / gain_linear
            b1 = -2 * np.cos(w0)
            b2 = 1 - alpha / gain_linear
        
        # Normalize coefficients
        a = [1.0, a1/a0, a2/a0]
        b = [b0/a0, b1/a0, b2/a0]
        
    elif eq_type == "analog":
        # Analog-style filter (different Q behavior)
        bandwidth = freq / q
        c = np.tan(np.pi * bandwidth / sample_rate)
        d = 2 * np.cos(2 * np.pi * freq / sample_rate)
        
        a0 = 1 + c
        a1 = -d
        a2 = 1 - c
        
        if gain >= 0:
            # Boost
            b0 = 1 + c * gain_linear
            b1 = -d
            b2 = 1 - c * gain_linear
        else:
            # Cut
            b0 = 1 + c / gain_linear
            b1 = -d
            b2 = 1 - c / gain_linear
        
        # Normalize coefficients
        a = [1.0, a1/a0, a2/a0]
        b = [b0/a0, b1/a0, b2/a0]
        
    elif eq_type == "vintage":
        # Vintage-style filter (asymmetric, more character)
        alpha = np.sin(w0) / (2 * q)
        beta = np.sqrt(gain_linear) / q
        
        if gain >= 0:
            # Boost with vintage character
            a0 = 1 + alpha / gain_linear
            a1 = -2 * np.cos(w0) * (1 + 0.02 * gain)  # Slight frequency shift with gain
            a2 = 1 - alpha / gain_linear + 0.01 * gain  # Slight resonance increase with gain
            b0 = 1 + alpha * gain_linear
            b1 = -2 * np.cos(w0 * 0.99)  # Slight frequency shift
            b2 = 1 - alpha * gain_linear + 0.02 * gain  # Non-linear behavior
        else:
            # Cut with vintage character
            a0 = 1 + alpha * gain_linear
            a1 = -2 * np.cos(w0) * (1 - 0.01 * gain)  # Slight frequency shift with gain
            a2 = 1 - alpha * gain_linear
            b0 = 1 + alpha / gain_linear
            b1 = -2 * np.cos(w0 * 1.01)  # Slight frequency shift
            b2 = 1 - alpha / gain_linear
        
        # Normalize coefficients
        a = [1.0, a1/a0, a2/a0]
        b = [b0/a0, b1/a0, b2/a0]
    
    else:
        # Default to digital
        alpha = np.sin(w0) / (2 * q)
        
        if gain >= 0:
            # Boost
            a0 = 1 + alpha / gain_linear
            a1 = -2 * np.cos(w0)
            a2 = 1 - alpha / gain_linear
            b0 = 1 + alpha * gain_linear
            b1 = -2 * np.cos(w0)
            b2 = 1 - alpha * gain_linear
        else:
            # Cut
            a0 = 1 + alpha * gain_linear
            a1 = -2 * np.cos(w0)
            a2 = 1 - alpha * gain_linear
            b0 = 1 + alpha / gain_linear
            b1 = -2 * np.cos(w0)
            b2 = 1 - alpha / gain_linear
        
        # Normalize coefficients
        a = [1.0, a1/a0, a2/a0]
        b = [b0/a0, b1/a0, b2/a0]
    
    # Apply filter
    return signal.lfilter(b, a, audio_data)

def apply_low_shelf_filter(audio_data, sample_rate, freq, gain, q, eq_type="digital"):
    """
    Apply low shelf filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq: Corner frequency in Hz
        gain: Gain in dB
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Convert gain from dB to linear
    gain_linear = 10 ** (gain / 20)
    
    # Normalize frequency
    w0 = 2 * np.pi * freq / sample_rate
    
    # Calculate filter coefficients
    if eq_type == "digital" or eq_type == "analog":  # Similar implementation for both
        alpha = np.sin(w0) / (2 * q)
        
        # Compute filter coefficients
        if gain >= 0:
            # Boost
            b0 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            b1 = 2 * gain_linear * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            b2 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
            a0 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            a1 = -2 * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            a2 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
        else:
            # Cut
            gain_linear = 1 / gain_linear  # Invert for cut
            b0 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            b1 = 2 * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            b2 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
            a0 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            a1 = -2 * gain_linear * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            a2 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
    
    elif eq_type == "vintage":
        # Vintage-style low shelf with more character
        alpha = np.sin(w0) / (2 * q * 0.9)  # Slightly different Q behavior
        
        # Add some non-linear behavior
        if gain >= 0:
            # Boost with vintage character
            gain_mod = gain_linear * (1 + 0.05 * np.sin(gain))  # Non-linear gain
            b0 = gain_mod * ((gain_mod + 1) - (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha)
            b1 = 2 * gain_mod * ((gain_mod - 1) - (gain_mod + 1) * np.cos(w0 * 0.98))  # Frequency shift
            b2 = gain_mod * ((gain_mod + 1) - (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha)
            a0 = (gain_mod + 1) + (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha
            a1 = -2 * ((gain_mod - 1) + (gain_mod + 1) * np.cos(w0 * 1.02))  # Frequency shift
            a2 = (gain_mod + 1) + (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha
        else:
            # Cut with vintage character
            gain_mod = 1 / (gain_linear * (1 - 0.02 * gain))  # Non-linear gain
            b0 = (gain_mod + 1) - (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha
            b1 = 2 * ((gain_mod - 1) - (gain_mod + 1) * np.cos(w0 * 1.01))  # Frequency shift
            b2 = (gain_mod + 1) - (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha
            a0 = gain_mod * ((gain_mod + 1) + (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha)
            a1 = -2 * gain_mod * ((gain_mod - 1) + (gain_mod + 1) * np.cos(w0 * 0.99))  # Frequency shift
            a2 = gain_mod * ((gain_mod + 1) + (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha)
    
    else:
        # Default to digital
        alpha = np.sin(w0) / (2 * q)
        
        # Compute filter coefficients
        if gain >= 0:
            # Boost
            b0 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            b1 = 2 * gain_linear * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            b2 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
            a0 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            a1 = -2 * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            a2 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
        else:
            # Cut
            gain_linear = 1 / gain_linear  # Invert for cut
            b0 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            b1 = 2 * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            b2 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
            a0 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            a1 = -2 * gain_linear * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            a2 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
    
    # Normalize coefficients
    a = [1.0, a1/a0, a2/a0]
    b = [b0/a0, b1/a0, b2/a0]
    
    # Apply filter
    return signal.lfilter(b, a, audio_data)

def apply_high_shelf_filter(audio_data, sample_rate, freq, gain, q, eq_type="digital"):
    """
    Apply high shelf filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq: Corner frequency in Hz
        gain: Gain in dB
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Convert gain from dB to linear
    gain_linear = 10 ** (gain / 20)
    
    # Normalize frequency
    w0 = 2 * np.pi * freq / sample_rate
    
    # Calculate filter coefficients
    if eq_type == "digital" or eq_type == "analog":  # Similar implementation for both
        alpha = np.sin(w0) / (2 * q)
        
        # Compute filter coefficients
        if gain >= 0:
            # Boost
            b0 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            b1 = -2 * gain_linear * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            b2 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
            a0 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            a1 = 2 * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            a2 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
        else:
            # Cut
            gain_linear = 1 / gain_linear  # Invert for cut
            b0 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            b1 = -2 * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            b2 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
            a0 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            a1 = 2 * gain_linear * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            a2 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
    
    elif eq_type == "vintage":
        # Vintage-style high shelf with more character
        alpha = np.sin(w0) / (2 * q * 1.1)  # Slightly different Q behavior
        
        # Add some non-linear behavior
        if gain >= 0:
            # Boost with vintage character
            gain_mod = gain_linear * (1 + 0.03 * np.sin(gain))  # Non-linear gain
            b0 = gain_mod * ((gain_mod + 1) + (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha)
            b1 = -2 * gain_mod * ((gain_mod - 1) + (gain_mod + 1) * np.cos(w0 * 1.02))  # Frequency shift
            b2 = gain_mod * ((gain_mod + 1) + (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha)
            a0 = (gain_mod + 1) - (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha
            a1 = 2 * ((gain_mod - 1) - (gain_mod + 1) * np.cos(w0 * 0.98))  # Frequency shift
            a2 = (gain_mod + 1) - (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha
        else:
            # Cut with vintage character
            gain_mod = 1 / (gain_linear * (1 - 0.01 * gain))  # Non-linear gain
            b0 = (gain_mod + 1) + (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha
            b1 = -2 * ((gain_mod - 1) + (gain_mod + 1) * np.cos(w0 * 0.99))  # Frequency shift
            b2 = (gain_mod + 1) + (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha
            a0 = gain_mod * ((gain_mod + 1) - (gain_mod - 1) * np.cos(w0) + 2 * np.sqrt(gain_mod) * alpha)
            a1 = 2 * gain_mod * ((gain_mod - 1) - (gain_mod + 1) * np.cos(w0 * 1.01))  # Frequency shift
            a2 = gain_mod * ((gain_mod + 1) - (gain_mod - 1) * np.cos(w0) - 2 * np.sqrt(gain_mod) * alpha)
    
    else:
        # Default to digital
        alpha = np.sin(w0) / (2 * q)
        
        # Compute filter coefficients
        if gain >= 0:
            # Boost
            b0 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            b1 = -2 * gain_linear * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            b2 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
            a0 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            a1 = 2 * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            a2 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
        else:
            # Cut
            gain_linear = 1 / gain_linear  # Invert for cut
            b0 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha
            b1 = -2 * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w0))
            b2 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha
            a0 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) + 2 * np.sqrt(gain_linear) * alpha)
            a1 = 2 * gain_linear * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w0))
            a2 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w0) - 2 * np.sqrt(gain_linear) * alpha)
    
    # Normalize coefficients
    a = [1.0, a1/a0, a2/a0]
    b = [b0/a0, b1/a0, b2/a0]
    
    # Apply filter
    return signal.lfilter(b, a, audio_data)

def apply_high_pass_filter(audio_data, sample_rate, freq, q, eq_type="digital"):
    """
    Apply high pass filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq: Cutoff frequency in Hz
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Normalize frequency
    w0 = 2 * np.pi * freq / sample_rate
    
    # Calculate filter coefficients
    if eq_type == "digital":
        # Digital biquad filter
        alpha = np.sin(w0) / (2 * q)
        
        b0 = (1 + np.cos(w0)) / 2
        b1 = -(1 + np.cos(w0))
        b2 = (1 + np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
        
    elif eq_type == "analog":
        # Analog-style filter (different Q behavior)
        alpha = np.sin(w0) / (2 * q * 0.9)  # Slightly different Q
        
        b0 = (1 + np.cos(w0)) / 2
        b1 = -(1 + np.cos(w0))
        b2 = (1 + np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
        
    elif eq_type == "vintage":
        # Vintage-style filter with more character
        alpha = np.sin(w0) / (2 * q * 0.8)  # Different Q behavior
        
        # Add some non-linear behavior
        w0_mod = w0 * 0.98  # Slight frequency shift
        
        b0 = (1 + np.cos(w0_mod)) / 2
        b1 = -(1 + np.cos(w0_mod))
        b2 = (1 + np.cos(w0_mod)) / 2
        a0 = 1 + alpha * 1.1  # Slightly more resonance
        a1 = -2 * np.cos(w0_mod)
        a2 = 1 - alpha * 0.9  # Asymmetric resonance
    
    else:
        # Default to digital
        alpha = np.sin(w0) / (2 * q)
        
        b0 = (1 + np.cos(w0)) / 2
        b1 = -(1 + np.cos(w0))
        b2 = (1 + np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
    
    # Normalize coefficients
    a = [1.0, a1/a0, a2/a0]
    b = [b0/a0, b1/a0, b2/a0]
    
    # Apply filter
    return signal.lfilter(b, a, audio_data)

def apply_low_pass_filter(audio_data, sample_rate, freq, q, eq_type="digital"):
    """
    Apply low pass filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq: Cutoff frequency in Hz
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Normalize frequency
    w0 = 2 * np.pi * freq / sample_rate
    
    # Calculate filter coefficients
    if eq_type == "digital":
        # Digital biquad filter
        alpha = np.sin(w0) / (2 * q)
        
        b0 = (1 - np.cos(w0)) / 2
        b1 = 1 - np.cos(w0)
        b2 = (1 - np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
        
    elif eq_type == "analog":
        # Analog-style filter (different Q behavior)
        alpha = np.sin(w0) / (2 * q * 0.9)  # Slightly different Q
        
        b0 = (1 - np.cos(w0)) / 2
        b1 = 1 - np.cos(w0)
        b2 = (1 - np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
        
    elif eq_type == "vintage":
        # Vintage-style filter with more character
        alpha = np.sin(w0) / (2 * q * 0.8)  # Different Q behavior
        
        # Add some non-linear behavior
        w0_mod = w0 * 1.02  # Slight frequency shift
        
        b0 = (1 - np.cos(w0_mod)) / 2
        b1 = 1 - np.cos(w0_mod)
        b2 = (1 - np.cos(w0_mod)) / 2
        a0 = 1 + alpha * 1.1  # Slightly more resonance
        a1 = -2 * np.cos(w0_mod)
        a2 = 1 - alpha * 0.9  # Asymmetric resonance
    
    else:
        # Default to digital
        alpha = np.sin(w0) / (2 * q)
        
        b0 = (1 - np.cos(w0)) / 2
        b1 = 1 - np.cos(w0)
        b2 = (1 - np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
    
    # Normalize coefficients
    a = [1.0, a1/a0, a2/a0]
    b = [b0/a0, b1/a0, b2/a0]
    
    # Apply filter
    return signal.lfilter(b, a, audio_data)

def apply_band_pass_filter(audio_data, sample_rate, freq_low, freq_high, q, eq_type="digital"):
    """
    Apply band pass filter to audio data
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        freq_low: Low cutoff frequency in Hz
        freq_high: High cutoff frequency in Hz
        q: Q factor
        eq_type: Type of EQ algorithm
        
    Returns:
        Processed audio data
    """
    # Apply high-pass then low-pass
    audio_data = apply_high_pass_filter(audio_data, sample_rate, freq_low, q, eq_type)
    audio_data = apply_low_pass_filter(audio_data, sample_rate, freq_high, q, eq_type)
    
    return audio_data

def auto_eq_from_analysis(audio_analysis):
    """
    Generate automatic EQ settings based on audio analysis
    
    Args:
        audio_analysis: Audio analysis data
        
    Returns:
        List of EQ bands to apply
    """
    eq_bands = []
    
    # Check if we have spectrum analysis
    if "spectrum_analysis" in audio_analysis:
        spectrum = audio_analysis["spectrum_analysis"]
        
        # Check for problem frequencies
        if "problems" in spectrum:
            problems = spectrum["problems"]
            
            # Add EQ bands to fix problems
            if "mud" in problems and problems["mud"]["detected"]:
                eq_bands.append({
                    "type": "peak",
                    "freq": 300,
                    "gain": -3.0,
                    "q": 1.2
                })
            
            if "boxiness" in problems and problems["boxiness"]["detected"]:
                eq_bands.append({
                    "type": "peak",
                    "freq": 500,
                    "gain": -2.5,
                    "q": 1.0
                })
            
            if "harshness" in problems and problems["harshness"]["detected"]:
                eq_bands.append({
                    "type": "peak",
                    "freq": 3000,
                    "gain": -2.0,
                    "q": 1.0
                })
            
            if "sibilance" in problems and problems["sibilance"]["detected"]:
                eq_bands.append({
                    "type": "peak",
                    "freq": 6500,
                    "gain": -3.0,
                    "q": 1.5
                })
            
            if "rumble" in problems and problems["rumble"]["detected"]:
                eq_bands.append({
                    "type": "high_pass",
                    "freq": 40,
                    "q": 0.7
                })
    
    # Check if we have loudness analysis
    if "loudness_analysis" in audio_analysis:
        loudness = audio_analysis["loudness_analysis"]
        
        # Add high-pass filter to remove sub-bass rumble
        eq_bands.append({
            "type": "high_pass",
            "freq": 30,
            "q": 0.7
        })
        
        # If dynamic range is very low, add some presence to make it more interesting
        if "dynamic_range" in loudness and loudness["dynamic_range"]["dr"] < 6:
            eq_bands.append({
                "type": "peak",
                "freq": 5000,
                "gain": 2.0,
                "q": 0.8
            })
    
    # If no specific problems found, add some general enhancement
    if not eq_bands:
        eq_bands = [
            {"type": "high_shelf", "freq": 8000, "gain": 1.5, "q": 0.7},
            {"type": "peak", "freq": 3000, "gain": 1.0, "q": 1.0},
            {"type": "peak", "freq": 300, "gain": -1.0, "q": 1.0},
            {"type": "high_pass", "freq": 30, "q": 0.7}
        ]
    
    return eq_bands