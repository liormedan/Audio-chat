"""
Advanced Spectrum Analyzer Extension for AudioChat

Provides high-resolution spectrum analysis with problem frequency detection
and comparison to professional reference spectrums.
"""

import numpy as np
from scipy import signal
import librosa
import json
from pathlib import Path

# Define capabilities
CAPABILITIES = [
    "high_resolution_spectrum", 
    "problem_frequency_detection",
    "spectrum_comparison", 
    "detailed_reports"
]

# Reference spectrums for different genres
REFERENCE_SPECTRUMS = {
    "pop": {
        "sub_bass": [20, 60, -12],       # Hz range and target dB
        "bass": [60, 250, -8],
        "low_mids": [250, 500, -10],
        "mids": [500, 2000, -12],
        "high_mids": [2000, 4000, -15],
        "presence": [4000, 6000, -18],
        "brilliance": [6000, 20000, -20]
    },
    "edm": {
        "sub_bass": [20, 60, -6],
        "bass": [60, 250, -4],
        "low_mids": [250, 500, -8],
        "mids": [500, 2000, -10],
        "high_mids": [2000, 4000, -12],
        "presence": [4000, 6000, -15],
        "brilliance": [6000, 20000, -18]
    },
    "rock": {
        "sub_bass": [20, 60, -15],
        "bass": [60, 250, -10],
        "low_mids": [250, 500, -8],
        "mids": [500, 2000, -6],
        "high_mids": [2000, 4000, -8],
        "presence": [4000, 6000, -10],
        "brilliance": [6000, 20000, -15]
    },
    "classical": {
        "sub_bass": [20, 60, -20],
        "bass": [60, 250, -15],
        "low_mids": [250, 500, -12],
        "mids": [500, 2000, -8],
        "high_mids": [2000, 4000, -10],
        "presence": [4000, 6000, -12],
        "brilliance": [6000, 20000, -15]
    },
    "jazz": {
        "sub_bass": [20, 60, -18],
        "bass": [60, 250, -12],
        "low_mids": [250, 500, -10],
        "mids": [500, 2000, -8],
        "high_mids": [2000, 4000, -10],
        "presence": [4000, 6000, -12],
        "brilliance": [6000, 20000, -15]
    }
}

# Problem frequency ranges to check
PROBLEM_FREQUENCIES = {
    "mud": [200, 400],
    "boxiness": [300, 600],
    "harshness": [2000, 4000],
    "sibilance": [5000, 8000],
    "rumble": [20, 60]
}

def process_audio(audio_data, sample_rate, audio_analysis=None):
    """
    Process audio with advanced spectrum analysis
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        audio_analysis: Optional audio analysis data
        
    Returns:
        The original audio data (this extension only analyzes, doesn't modify)
    """
    # Perform advanced analysis
    analysis_results = analyze_spectrum(audio_data, sample_rate)
    
    # Store results in audio_analysis if provided
    if audio_analysis is not None:
        audio_analysis.update(analysis_results)
    
    # This extension doesn't modify the audio, just analyzes it
    return audio_data

def analyze_spectrum(audio_data, sample_rate):
    """
    Perform advanced spectrum analysis
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        Dictionary with analysis results
    """
    # Calculate high-resolution spectrum
    n_fft = 8192  # High resolution FFT
    hop_length = 1024
    
    # Calculate spectrogram
    S = np.abs(librosa.stft(audio_data, n_fft=n_fft, hop_length=hop_length))
    
    # Convert to dB scale
    S_db = librosa.amplitude_to_db(S, ref=np.max)
    
    # Calculate average spectrum
    avg_spectrum = np.mean(S_db, axis=1)
    
    # Get frequency bins
    freqs = librosa.fft_frequencies(sr=sample_rate, n_fft=n_fft)
    
    # Analyze frequency bands
    bands = analyze_frequency_bands(freqs, avg_spectrum)
    
    # Detect problem frequencies
    problems = detect_problem_frequencies(freqs, avg_spectrum)
    
    # Compare to reference spectrums
    comparisons = compare_to_references(bands)
    
    # Generate detailed report
    report = generate_report(bands, problems, comparisons)
    
    # Create visualization data
    visualization = {
        "frequencies": freqs.tolist(),
        "spectrum": avg_spectrum.tolist(),
        "bands": bands,
        "problems": problems
    }
    
    return {
        "spectrum_analysis": {
            "bands": bands,
            "problems": problems,
            "comparisons": comparisons,
            "report": report,
            "visualization": visualization
        }
    }

def analyze_frequency_bands(freqs, spectrum):
    """
    Analyze different frequency bands
    
    Args:
        freqs: Frequency bins
        spectrum: Spectrum values in dB
        
    Returns:
        Dictionary with band analysis
    """
    bands = {
        "sub_bass": [20, 60],
        "bass": [60, 250],
        "low_mids": [250, 500],
        "mids": [500, 2000],
        "high_mids": [2000, 4000],
        "presence": [4000, 6000],
        "brilliance": [6000, 20000]
    }
    
    results = {}
    
    for band_name, (low_freq, high_freq) in bands.items():
        # Get indices for this band
        band_indices = np.where((freqs >= low_freq) & (freqs <= high_freq))[0]
        
        if len(band_indices) > 0:
            # Calculate statistics for this band
            band_spectrum = spectrum[band_indices]
            results[band_name] = {
                "average_db": float(np.mean(band_spectrum)),
                "peak_db": float(np.max(band_spectrum)),
                "min_db": float(np.min(band_spectrum)),
                "range_db": float(np.max(band_spectrum) - np.min(band_spectrum))
            }
        else:
            results[band_name] = {
                "average_db": 0,
                "peak_db": 0,
                "min_db": 0,
                "range_db": 0
            }
    
    return results

def detect_problem_frequencies(freqs, spectrum):
    """
    Detect potential problem frequencies
    
    Args:
        freqs: Frequency bins
        spectrum: Spectrum values in dB
        
    Returns:
        Dictionary with problem frequency analysis
    """
    problems = {}
    
    for problem_name, (low_freq, high_freq) in PROBLEM_FREQUENCIES.items():
        # Get indices for this frequency range
        range_indices = np.where((freqs >= low_freq) & (freqs <= high_freq))[0]
        
        if len(range_indices) > 0:
            # Calculate statistics for this range
            range_spectrum = spectrum[range_indices]
            range_freqs = freqs[range_indices]
            
            # Find peaks in this range
            peaks, _ = signal.find_peaks(range_spectrum, height=-40, distance=5)
            
            if len(peaks) > 0:
                peak_freqs = range_freqs[peaks]
                peak_values = range_spectrum[peaks]
                
                # Sort peaks by amplitude
                sorted_indices = np.argsort(peak_values)[::-1]
                peak_freqs = peak_freqs[sorted_indices]
                peak_values = peak_values[sorted_indices]
                
                # Take top 3 peaks
                top_peaks = [(float(freq), float(val)) for freq, val in zip(peak_freqs[:3], peak_values[:3])]
                
                # Calculate average level in this range
                avg_level = float(np.mean(range_spectrum))
                
                # Determine if this is a problem based on average level
                is_problem = avg_level > -20  # Threshold for problem detection
                
                problems[problem_name] = {
                    "detected": is_problem,
                    "average_level": avg_level,
                    "peaks": top_peaks,
                    "description": get_problem_description(problem_name)
                }
            else:
                problems[problem_name] = {
                    "detected": False,
                    "average_level": float(np.mean(range_spectrum)),
                    "peaks": [],
                    "description": get_problem_description(problem_name)
                }
        else:
            problems[problem_name] = {
                "detected": False,
                "average_level": 0,
                "peaks": [],
                "description": get_problem_description(problem_name)
            }
    
    return problems

def compare_to_references(bands):
    """
    Compare spectrum to reference spectrums
    
    Args:
        bands: Analyzed frequency bands
        
    Returns:
        Dictionary with comparison results
    """
    comparisons = {}
    
    for genre, reference in REFERENCE_SPECTRUMS.items():
        genre_score = 0
        band_scores = {}
        
        for band_name, (low_freq, high_freq, target_db) in reference.items():
            if band_name in bands:
                # Calculate difference from target
                actual_db = bands[band_name]["average_db"]
                difference = abs(actual_db - target_db)
                
                # Calculate score (0-100) based on difference
                # Lower difference = higher score
                band_score = max(0, 100 - difference * 5)  # 5 points per dB difference
                
                band_scores[band_name] = {
                    "score": float(band_score),
                    "difference": float(actual_db - target_db),
                    "target": target_db,
                    "actual": float(actual_db)
                }
                
                genre_score += band_score
        
        # Average score across all bands
        if len(band_scores) > 0:
            genre_score /= len(band_scores)
        
        comparisons[genre] = {
            "overall_score": float(genre_score),
            "band_scores": band_scores
        }
    
    # Find best matching genre
    best_genre = max(comparisons.items(), key=lambda x: x[1]["overall_score"])
    
    return {
        "genres": comparisons,
        "best_match": {
            "genre": best_genre[0],
            "score": float(best_genre[1]["overall_score"])
        }
    }

def generate_report(bands, problems, comparisons):
    """
    Generate a detailed report based on analysis
    
    Args:
        bands: Analyzed frequency bands
        problems: Detected problem frequencies
        comparisons: Comparison to reference spectrums
        
    Returns:
        Dictionary with report data
    """
    # Generate overall assessment
    overall_assessment = []
    
    # Check for detected problems
    detected_problems = [name for name, data in problems.items() if data["detected"]]
    if detected_problems:
        problem_text = "Detected potential issues in: " + ", ".join(detected_problems)
        overall_assessment.append(problem_text)
    
    # Add genre match information
    best_genre = comparisons["best_match"]["genre"]
    best_score = comparisons["best_match"]["score"]
    overall_assessment.append(f"Spectrum most closely matches {best_genre} genre (similarity: {best_score:.1f}%)")
    
    # Generate recommendations
    recommendations = []
    
    # Recommendations based on problems
    for problem_name, data in problems.items():
        if data["detected"]:
            recommendations.append(get_problem_recommendation(problem_name))
    
    # Recommendations based on comparison to best genre
    best_genre_data = comparisons["genres"][best_genre]["band_scores"]
    for band_name, data in best_genre_data.items():
        if abs(data["difference"]) > 3:  # More than 3dB difference
            if data["difference"] > 0:
                recommendations.append(f"Reduce {band_name} by approximately {abs(data['difference']):.1f}dB to better match {best_genre} genre")
            else:
                recommendations.append(f"Boost {band_name} by approximately {abs(data['difference']):.1f}dB to better match {best_genre} genre")
    
    return {
        "overall_assessment": overall_assessment,
        "recommendations": recommendations
    }

def get_problem_description(problem_name):
    """Get description for a problem frequency range"""
    descriptions = {
        "mud": "Excessive energy in the low-mid range causing a muddy, unclear sound",
        "boxiness": "Resonance in the low-mids that creates a boxy, confined sound",
        "harshness": "Excessive energy in the upper-mids causing listening fatigue",
        "sibilance": "Excessive high frequencies causing harsh S and T sounds",
        "rumble": "Excessive sub-bass that can cause unwanted vibrations or distortion"
    }
    return descriptions.get(problem_name, "")

def get_problem_recommendation(problem_name):
    """Get recommendation for fixing a problem frequency range"""
    recommendations = {
        "mud": "Apply a gentle cut around 200-400Hz to reduce muddiness and improve clarity",
        "boxiness": "Apply a narrow cut around 300-600Hz to reduce boxiness",
        "harshness": "Apply a gentle cut around 2-4kHz to reduce harshness and listening fatigue",
        "sibilance": "Apply a de-esser or cut around 5-8kHz to reduce sibilance",
        "rumble": "Apply a high-pass filter around 30Hz to reduce unwanted sub-bass rumble"
    }
    return recommendations.get(problem_name, "")