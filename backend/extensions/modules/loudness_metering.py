"""
Loudness Metering Extension for AudioChat

Provides professional loudness metering according to industry standards,
including LUFS, RMS, True Peak measurements, and dynamic range analysis.
"""

import numpy as np
import librosa
from scipy import signal

# Define capabilities
CAPABILITIES = [
    "lufs_measurement", 
    "true_peak_detection",
    "dynamic_range_analysis", 
    "loudness_recommendations"
]

def process_audio(audio_data, sample_rate, audio_analysis=None):
    """
    Process audio with loudness metering
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        audio_analysis: Optional audio analysis data
        
    Returns:
        The original audio data (this extension only analyzes, doesn't modify)
    """
    # Perform loudness analysis
    loudness_results = analyze_loudness(audio_data, sample_rate)
    
    # Store results in audio_analysis if provided
    if audio_analysis is not None:
        audio_analysis.update(loudness_results)
    
    # This extension doesn't modify the audio, just analyzes it
    return audio_data

def analyze_loudness(audio_data, sample_rate):
    """
    Perform comprehensive loudness analysis
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        Dictionary with loudness analysis results
    """
    # Calculate LUFS (Loudness Units Full Scale)
    integrated_lufs = measure_integrated_lufs(audio_data, sample_rate)
    short_term_lufs = measure_short_term_lufs(audio_data, sample_rate)
    momentary_lufs = measure_momentary_lufs(audio_data, sample_rate)
    
    # Calculate True Peak
    true_peak = measure_true_peak(audio_data, sample_rate)
    
    # Calculate RMS
    rms_value = float(np.sqrt(np.mean(audio_data**2)))
    rms_db = float(20 * np.log10(rms_value + 1e-10))
    
    # Calculate dynamic range
    dynamic_range = analyze_dynamic_range(audio_data, sample_rate)
    
    # Check for clipping
    is_clipping = check_for_clipping(audio_data)
    
    # Generate loudness histogram data
    histogram_data = generate_loudness_histogram(audio_data)
    
    # Generate recommendations
    recommendations = generate_loudness_recommendations(
        integrated_lufs, true_peak, dynamic_range, is_clipping
    )
    
    return {
        "loudness_analysis": {
            "integrated_lufs": integrated_lufs,
            "short_term_lufs": short_term_lufs,
            "momentary_lufs": momentary_lufs,
            "true_peak": true_peak,
            "rms_db": rms_db,
            "dynamic_range": dynamic_range,
            "is_clipping": is_clipping,
            "histogram": histogram_data,
            "recommendations": recommendations
        }
    }

def measure_integrated_lufs(audio_data, sample_rate):
    """
    Measure integrated LUFS according to ITU-R BS.1770-4
    
    This is a simplified implementation of the LUFS algorithm.
    For production use, consider using a dedicated library like pyloudnorm.
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        Integrated LUFS value
    """
    # Apply K-weighting filter (simplified)
    # Pre-filter: high-shelf at 1681Hz, +4dB
    b_pre, a_pre = signal.butter(2, 1681/(sample_rate/2), 'high', analog=False)
    filtered_audio = signal.lfilter(b_pre, a_pre, audio_data)
    
    # RLB filter: high-pass at 38Hz
    b_rlb, a_rlb = signal.butter(2, 38/(sample_rate/2), 'high', analog=False)
    filtered_audio = signal.lfilter(b_rlb, a_rlb, filtered_audio)
    
    # Calculate mean square
    ms = np.mean(filtered_audio**2)
    
    # Convert to LUFS
    lufs = -0.691 + 10 * np.log10(ms)
    
    return float(lufs)

def measure_short_term_lufs(audio_data, sample_rate):
    """
    Measure short-term LUFS (3 second windows)
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        List of short-term LUFS values
    """
    window_size = 3 * sample_rate  # 3 seconds
    hop_size = sample_rate  # 1 second
    
    short_term_values = []
    
    for i in range(0, len(audio_data) - window_size, hop_size):
        window = audio_data[i:i+window_size]
        lufs = measure_integrated_lufs(window, sample_rate)
        short_term_values.append(float(lufs))
    
    # If we have values, also return min, max, and average
    result = {
        "values": short_term_values
    }
    
    if short_term_values:
        result["min"] = float(min(short_term_values))
        result["max"] = float(max(short_term_values))
        result["average"] = float(np.mean(short_term_values))
    else:
        result["min"] = 0.0
        result["max"] = 0.0
        result["average"] = 0.0
    
    return result

def measure_momentary_lufs(audio_data, sample_rate):
    """
    Measure momentary LUFS (400ms windows)
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        List of momentary LUFS values
    """
    window_size = int(0.4 * sample_rate)  # 400ms
    hop_size = int(0.1 * sample_rate)  # 100ms
    
    momentary_values = []
    
    for i in range(0, len(audio_data) - window_size, hop_size):
        window = audio_data[i:i+window_size]
        lufs = measure_integrated_lufs(window, sample_rate)
        momentary_values.append(float(lufs))
    
    # If we have values, also return min, max, and average
    result = {
        "values": momentary_values[:100]  # Limit to 100 values to keep response size reasonable
    }
    
    if momentary_values:
        result["min"] = float(min(momentary_values))
        result["max"] = float(max(momentary_values))
        result["average"] = float(np.mean(momentary_values))
    else:
        result["min"] = 0.0
        result["max"] = 0.0
        result["average"] = 0.0
    
    return result

def measure_true_peak(audio_data, sample_rate):
    """
    Measure true peak according to ITU-R BS.1770-4
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        True peak value in dBTP
    """
    # Oversample by 4x for true-peak measurement
    oversampling_factor = 4
    
    # Use polyphase resampling for better accuracy
    audio_oversampled = librosa.resample(
        audio_data, 
        orig_sr=sample_rate, 
        target_sr=sample_rate * oversampling_factor
    )
    
    # Find absolute peak
    peak_value = float(np.max(np.abs(audio_oversampled)))
    
    # Convert to dB
    peak_db = float(20 * np.log10(peak_value + 1e-10))
    
    return {
        "peak_db": peak_db,
        "peak_value": peak_value,
        "exceeds_threshold": peak_db > -1.0  # True if exceeds -1 dBTP
    }

def analyze_dynamic_range(audio_data, sample_rate):
    """
    Analyze dynamic range of the audio
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        Dictionary with dynamic range analysis
    """
    # Calculate RMS in 1-second windows
    window_size = sample_rate
    hop_size = sample_rate // 2
    
    rms_values = []
    
    for i in range(0, len(audio_data) - window_size, hop_size):
        window = audio_data[i:i+window_size]
        rms = np.sqrt(np.mean(window**2))
        rms_db = 20 * np.log10(rms + 1e-10)
        rms_values.append(float(rms_db))
    
    if not rms_values:
        return {
            "dr": 0.0,
            "crest_factor": 0.0,
            "psr": 0.0,
            "assessment": "Unknown"
        }
    
    # Calculate dynamic range (difference between loudest and quietest parts)
    rms_values = np.array(rms_values)
    rms_values = rms_values[rms_values > -60]  # Ignore very quiet sections
    
    if len(rms_values) > 0:
        dynamic_range = float(np.max(rms_values) - np.min(rms_values))
    else:
        dynamic_range = 0.0
    
    # Calculate crest factor (peak / RMS)
    peak_value = float(np.max(np.abs(audio_data)))
    rms_value = float(np.sqrt(np.mean(audio_data**2)))
    crest_factor = float(peak_value / (rms_value + 1e-10))
    crest_factor_db = float(20 * np.log10(crest_factor + 1e-10))
    
    # Calculate PSR (Peak to Short-term loudness Ratio)
    peak_db = float(20 * np.log10(peak_value + 1e-10))
    short_term_avg = float(np.mean(rms_values))
    psr = float(peak_db - short_term_avg)
    
    # Assess dynamic range
    if dynamic_range < 6:
        assessment = "Very compressed"
    elif dynamic_range < 10:
        assessment = "Compressed"
    elif dynamic_range < 14:
        assessment = "Moderately dynamic"
    else:
        assessment = "Very dynamic"
    
    return {
        "dr": dynamic_range,
        "crest_factor": crest_factor_db,
        "psr": psr,
        "assessment": assessment
    }

def check_for_clipping(audio_data):
    """
    Check if audio contains clipping
    
    Args:
        audio_data: Audio data as numpy array
        
    Returns:
        Dictionary with clipping analysis
    """
    # Count samples at or very near maximum amplitude
    threshold = 0.999  # Allow for small floating point differences
    clipped_samples = np.sum(np.abs(audio_data) >= threshold)
    
    # Check for consecutive clipped samples (more likely to be audible)
    consecutive_threshold = 3
    consecutive_count = 0
    max_consecutive = 0
    
    for sample in np.abs(audio_data):
        if sample >= threshold:
            consecutive_count += 1
            max_consecutive = max(max_consecutive, consecutive_count)
        else:
            consecutive_count = 0
    
    # Calculate percentage of clipped samples
    clip_percentage = float(clipped_samples / len(audio_data) * 100)
    
    # Determine if clipping is likely to be audible
    is_audible = max_consecutive >= consecutive_threshold
    
    return {
        "clipped_samples": int(clipped_samples),
        "clip_percentage": clip_percentage,
        "max_consecutive": int(max_consecutive),
        "is_audible": is_audible
    }

def generate_loudness_histogram(audio_data):
    """
    Generate histogram data for loudness distribution
    
    Args:
        audio_data: Audio data as numpy array
        
    Returns:
        Dictionary with histogram data
    """
    # Convert to dB scale with 1dB bins
    db_values = 20 * np.log10(np.abs(audio_data) + 1e-10)
    
    # Limit range to -60dB to 0dB
    db_values = db_values[db_values > -60]
    db_values = db_values[db_values < 0]
    
    # Create histogram
    hist, bin_edges = np.histogram(db_values, bins=60, range=(-60, 0))
    
    # Convert to list for JSON serialization
    hist_list = [int(count) for count in hist]
    bin_list = [float(edge) for edge in bin_edges[:-1]]  # Exclude the last edge
    
    return {
        "counts": hist_list,
        "bins": bin_list
    }

def generate_loudness_recommendations(integrated_lufs, true_peak, dynamic_range, is_clipping):
    """
    Generate recommendations based on loudness analysis
    
    Args:
        integrated_lufs: Integrated LUFS measurement
        true_peak: True peak measurement
        dynamic_range: Dynamic range analysis
        is_clipping: Clipping analysis
        
    Returns:
        List of recommendations
    """
    recommendations = []
    
    # Check integrated LUFS against common platform targets
    platforms = {
        "Spotify": -14.0,
        "YouTube": -14.0,
        "Apple Music": -16.0,
        "Amazon Music": -14.0,
        "Tidal": -14.0,
        "CD": -9.0
    }
    
    for platform, target in platforms.items():
        difference = integrated_lufs - target
        if abs(difference) > 1.0:  # More than 1 LU difference
            if difference > 0:
                recommendations.append(f"Lower volume by {difference:.1f} dB for {platform} (target: {target} LUFS)")
            else:
                recommendations.append(f"Raise volume by {-difference:.1f} dB for {platform} (target: {target} LUFS)")
    
    # Check true peak
    if true_peak["peak_db"] > -1.0:
        recommendations.append(f"Reduce true peak to below -1 dBTP (currently {true_peak['peak_db']:.1f} dBTP)")
    
    # Check for clipping
    if is_clipping["is_audible"]:
        recommendations.append(f"Fix clipping issues ({is_clipping['clipped_samples']} clipped samples detected)")
    
    # Check dynamic range
    if dynamic_range["dr"] < 6:
        recommendations.append("Increase dynamic range by using less compression")
    elif dynamic_range["dr"] > 20:
        recommendations.append("Consider adding some compression to control excessive dynamic range")
    
    return recommendations