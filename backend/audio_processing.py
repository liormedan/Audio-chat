"""
Advanced Audio Processing Module for AudioChat

This module provides sophisticated audio processing capabilities for the AudioChat application.
It includes functions for various audio effects, analysis, and processing chains.
"""

import numpy as np
import librosa
import soundfile as sf
from scipy import signal
import logging
from pathlib import Path
import json
import re

# Initialize logging
logger = logging.getLogger(__name__)

class AudioProcessor:
    """Main audio processing class that handles all audio manipulation"""
    
    def __init__(self):
        """Initialize the audio processor"""
        self.supported_effects = {
            "eq": self.apply_eq,
            "compression": self.apply_compression,
            "reverb": self.apply_reverb,
            "noise_reduction": self.apply_noise_reduction,
            "delay": self.apply_delay,
            "pitch_shift": self.apply_pitch_shift,
            "time_stretch": self.apply_time_stretch,
            "stereo_width": self.apply_stereo_width,
            "limiter": self.apply_limiter,
            "distortion": self.apply_distortion,
            "filter": self.apply_filter,
            "gate": self.apply_gate
        }
        
        # Common EQ presets
        self.eq_presets = {
            "warm": {"low": 3, "low_mid": 1, "high_mid": -1, "high": -2},
            "bright": {"low": -2, "low_mid": -1, "high_mid": 2, "high": 4},
            "telephone": {"low": -15, "low_mid": 5, "high_mid": 5, "high": -15},
            "radio": {"low": -10, "low_mid": 2, "high_mid": 2, "high": -8},
            "scooped": {"low": 2, "low_mid": -4, "high_mid": -4, "high": 2},
            "vocal_presence": {"low": -1, "low_mid": -2, "high_mid": 4, "high": 2}
        }
        
    def analyze_audio(self, audio_data, sample_rate):
        """
        Analyze audio to extract key features
        
        Args:
            audio_data: numpy array of audio samples
            sample_rate: sample rate of the audio
            
        Returns:
            dict: Analysis results including loudness, spectral features, etc.
        """
        try:
            # Convert to mono if stereo
            if len(audio_data.shape) > 1:
                audio_mono = np.mean(audio_data, axis=0)
            else:
                audio_mono = audio_data
                
            # Calculate RMS (rough loudness estimate)
            rms = np.sqrt(np.mean(audio_mono**2))
            
            # Calculate peak level
            peak = np.max(np.abs(audio_mono))
            
            # Calculate crest factor (peak to RMS ratio)
            crest_factor = peak / (rms + 1e-10)  # Avoid division by zero
            
            # Spectral centroid (brightness)
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(
                y=audio_mono, sr=sample_rate)[0])
                
            # Spectral rolloff (indication of high frequency content)
            rolloff = np.mean(librosa.feature.spectral_rolloff(
                y=audio_mono, sr=sample_rate)[0])
                
            # Estimate tempo
            tempo, _ = librosa.beat.beat_track(y=audio_mono, sr=sample_rate)
            
            # Detect key (this is a simplified approach)
            chroma = librosa.feature.chroma_stft(y=audio_mono, sr=sample_rate)
            key_index = np.argmax(np.mean(chroma, axis=1))
            keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            estimated_key = keys[key_index]
            
            # Check for clipping
            is_clipping = peak >= 0.99
            
            # Check for very low level
            is_too_quiet = peak < 0.1
            
            # Noise floor estimation (simplified)
            noise_floor = np.percentile(np.abs(audio_mono), 5)
            
            return {
                "rms_level": float(rms),
                "peak_level": float(peak),
                "crest_factor": float(crest_factor),
                "spectral_centroid": float(spectral_centroid),
                "spectral_rolloff": float(rolloff),
                "estimated_tempo": float(tempo),
                "estimated_key": estimated_key,
                "is_clipping": bool(is_clipping),
                "is_too_quiet": bool(is_too_quiet),
                "noise_floor": float(noise_floor)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing audio: {str(e)}")
            return {
                "error": str(e)
            }
    
    def parse_instructions(self, instructions, audio_analysis=None):
        """
        Parse natural language instructions to determine processing chain
        
        Args:
            instructions: String containing user's processing request
            audio_analysis: Optional dict with audio analysis results
            
        Returns:
            list: Processing chain with effects and parameters
        """
        instructions = instructions.lower()
        processing_chain = []
        
        # Check for EQ-related instructions
        if any(word in instructions for word in ["eq", "equalization", "equalizer", "bass", "treble", 
                                               "mid", "frequency", "frequencies", "tone"]):
            eq_params = {}
            
            # Check for EQ presets first
            for preset_name in self.eq_presets:
                if preset_name in instructions:
                    eq_params = self.eq_presets[preset_name].copy()
                    break
            
            # Check for specific frequency adjustments
            if "bass" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["low"] = 4
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["low"] = -4
                else:
                    eq_params["low"] = 2
                    
            if "mid" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["mid"] = 3
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["mid"] = -3
                    
            if "treble" in instructions or "high" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["high"] = 3
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["high"] = -3
            
            # Add EQ to processing chain if parameters were set
            if eq_params:
                processing_chain.append({
                    "type": "eq",
                    "parameters": eq_params
                })
        
        # Check for compression-related instructions
        if any(word in instructions for word in ["compress", "compression", "dynamics", "punchy", "tight"]):
            comp_params = {
                "threshold": -20,
                "ratio": 3,
                "attack": 20,
                "release": 250
            }
            
            # Adjust parameters based on instructions
            if "heavy" in instructions or "strong" in instructions:
                comp_params["ratio"] = 6
                comp_params["threshold"] = -24
            elif "light" in instructions or "gentle" in instructions or "subtle" in instructions:
                comp_params["ratio"] = 2
                comp_params["threshold"] = -18
                
            if "fast" in instructions:
                comp_params["attack"] = 5
                comp_params["release"] = 100
            elif "slow" in instructions:
                comp_params["attack"] = 50
                comp_params["release"] = 500
                
            processing_chain.append({
                "type": "compression",
                "parameters": comp_params
            })
        
        # Check for reverb-related instructions
        if any(word in instructions for word in ["reverb", "echo", "space", "room", "hall", "ambience"]):
            reverb_params = {
                "room_size": 0.5,
                "damping": 0.5,
                "wet_level": 0.33,
                "dry_level": 0.7
            }
            
            # Adjust parameters based on instructions
            if "large" in instructions or "hall" in instructions or "cathedral" in instructions:
                reverb_params["room_size"] = 0.85
                reverb_params["wet_level"] = 0.4
            elif "small" in instructions or "room" in instructions or "booth" in instructions:
                reverb_params["room_size"] = 0.3
                reverb_params["wet_level"] = 0.25
                
            if "more" in instructions or "wet" in instructions:
                reverb_params["wet_level"] += 0.15
                reverb_params["dry_level"] -= 0.15
            elif "less" in instructions or "subtle" in instructions or "gentle" in instructions:
                reverb_params["wet_level"] -= 0.1
                reverb_params["dry_level"] += 0.1
                
            processing_chain.append({
                "type": "reverb",
                "parameters": reverb_params
            })
        
        # Check for noise reduction
        if any(word in instructions for word in ["noise", "clean", "background", "hiss", "hum"]):
            noise_params = {
                "strength": 0.5,
                "sensitivity": 0.5
            }
            
            if "strong" in instructions or "heavy" in instructions:
                noise_params["strength"] = 0.8
            elif "light" in instructions or "gentle" in instructions:
                noise_params["strength"] = 0.3
                
            processing_chain.append({
                "type": "noise_reduction",
                "parameters": noise_params
            })
        
        # Check for delay/echo effect
        if any(word in instructions for word in ["delay", "echo", "repeat"]) and "echo" not in str(processing_chain):
            delay_params = {
                "time": 0.25,  # 250ms delay
                "feedback": 0.3,
                "mix": 0.3
            }
            
            if "long" in instructions:
                delay_params["time"] = 0.5
                delay_params["feedback"] = 0.4
            elif "short" in instructions:
                delay_params["time"] = 0.125
                delay_params["feedback"] = 0.2
                
            if "more" in instructions:
                delay_params["mix"] = 0.5
            elif "subtle" in instructions or "less" in instructions:
                delay_params["mix"] = 0.2
                
            processing_chain.append({
                "type": "delay",
                "parameters": delay_params
            })
        
        # Check for pitch shifting
        if any(word in instructions for word in ["pitch", "higher", "lower", "deeper", "chipmunk"]):
            pitch_params = {
                "semitones": 0
            }
            
            if "higher" in instructions or "up" in instructions:
                pitch_params["semitones"] = 2
            elif "lower" in instructions or "down" in instructions or "deeper" in instructions:
                pitch_params["semitones"] = -2
            elif "chipmunk" in instructions:
                pitch_params["semitones"] = 6
                
            # Look for specific semitone values
            semitone_match = re.search(r'(\d+)\s*semitone', instructions)
            if semitone_match:
                semitones = int(semitone_match.group(1))
                if "down" in instructions or "lower" in instructions:
                    semitones = -semitones
                pitch_params["semitones"] = semitones
                
            processing_chain.append({
                "type": "pitch_shift",
                "parameters": pitch_params
            })
        
        # Check for time stretching
        if any(word in instructions for word in ["faster", "slower", "speed", "tempo"]):
            time_params = {
                "rate": 1.0
            }
            
            if "faster" in instructions or "speed up" in instructions:
                time_params["rate"] = 1.2
            elif "slower" in instructions or "slow down" in instructions:
                time_params["rate"] = 0.8
                
            # Look for specific percentage values
            percent_match = re.search(r'(\d+)%\s*(faster|slower)', instructions)
            if percent_match:
                percent = int(percent_match.group(1)) / 100
                if "faster" in percent_match.group(2):
                    time_params["rate"] = 1 + percent
                else:
                    time_params["rate"] = 1 - percent
                    
            processing_chain.append({
                "type": "time_stretch",
                "parameters": time_params
            })
        
        # Check for stereo width adjustments
        if any(word in instructions for word in ["stereo", "width", "wide", "narrow", "mono"]):
            width_params = {
                "width": 1.0  # 1.0 is normal stereo
            }
            
            if "wider" in instructions or "more" in instructions:
                width_params["width"] = 1.5
            elif "narrower" in instructions or "less" in instructions:
                width_params["width"] = 0.7
            elif "mono" in instructions:
                width_params["width"] = 0.0
                
            processing_chain.append({
                "type": "stereo_width",
                "parameters": width_params
            })
        
        # Check for limiting/maximizing
        if any(word in instructions for word in ["louder", "maximize", "limit", "volume", "gain"]):
            limiter_params = {
                "gain": 0,
                "threshold": -0.3,
                "release": 50
            }
            
            if "louder" in instructions or "maximize" in instructions:
                limiter_params["gain"] = 6
            elif "quieter" in instructions or "softer" in instructions:
                limiter_params["gain"] = -6
                
            processing_chain.append({
                "type": "limiter",
                "parameters": limiter_params
            })
        
        # Check for distortion/saturation
        if any(word in instructions for word in ["distort", "distortion", "saturate", "saturation", "warm", "analog"]):
            dist_params = {
                "drive": 2.0,
                "mix": 0.5
            }
            
            if "heavy" in instructions or "more" in instructions:
                dist_params["drive"] = 5.0
                dist_params["mix"] = 0.7
            elif "subtle" in instructions or "light" in instructions or "warm" in instructions:
                dist_params["drive"] = 1.5
                dist_params["mix"] = 0.3
                
            processing_chain.append({
                "type": "distortion",
                "parameters": dist_params
            })
        
        # Check for filter effects
        if any(word in instructions for word in ["filter", "lowpass", "highpass", "bandpass", "telephone", "radio"]):
            filter_params = {
                "type": "bandpass",
                "cutoff_low": 500,
                "cutoff_high": 3000,
                "resonance": 0.7
            }
            
            if "lowpass" in instructions or "low pass" in instructions:
                filter_params["type"] = "lowpass"
                filter_params["cutoff_high"] = 1000
            elif "highpass" in instructions or "high pass" in instructions:
                filter_params["type"] = "highpass"
                filter_params["cutoff_low"] = 1000
            elif "telephone" in instructions:
                filter_params["cutoff_low"] = 800
                filter_params["cutoff_high"] = 3000
            elif "radio" in instructions:
                filter_params["cutoff_low"] = 500
                filter_params["cutoff_high"] = 5000
                
            processing_chain.append({
                "type": "filter",
                "parameters": filter_params
            })
        
        # If no effects were detected, add a default subtle enhancement
        if not processing_chain and audio_analysis:
            # Check if audio needs enhancement based on analysis
            if audio_analysis.get("is_too_quiet", False):
                processing_chain.append({
                    "type": "limiter",
                    "parameters": {"gain": 6, "threshold": -0.3, "release": 50}
                })
                
            if audio_analysis.get("noise_floor", 0) > 0.01:
                processing_chain.append({
                    "type": "noise_reduction",
                    "parameters": {"strength": 0.4, "sensitivity": 0.5}
                })
                
            # Add subtle enhancement EQ
            processing_chain.append({
                "type": "eq",
                "parameters": {"low": 1, "high": 1}
            })
        
        return processing_chain
    
    def process_audio(self, audio_data, sample_rate, instructions, effects=None):
        """
        Process audio based on natural language instructions or explicit effects chain
        
        Args:
            audio_data: numpy array of audio samples
            sample_rate: sample rate of the audio
            instructions: String containing user's processing request
            effects: Optional list of effects to apply
            
        Returns:
            tuple: (processed_audio, processing_steps)
        """
        try:
            # Analyze audio
            analysis = self.analyze_audio(audio_data, sample_rate)
            
            # Determine processing chain
            if effects is None:
                processing_chain = self.parse_instructions(instructions, analysis)
            else:
                processing_chain = effects
                
            # Apply processing chain
            processed_audio = audio_data.copy()
            processing_steps = []
            
            for effect in processing_chain:
                effect_type = effect["type"]
                parameters = effect["parameters"]
                
                if effect_type in self.supported_effects:
                    # Apply the effect
                    processed_audio = self.supported_effects[effect_type](processed_audio, sample_rate, parameters)
                    
                    # Add to processing steps
                    step_description = self.describe_effect(effect_type, parameters)
                    processing_steps.append(step_description)
                    
            return processed_audio, processing_steps
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return audio_data, [f"Error: {str(e)}"]
    
    def describe_effect(self, effect_type, parameters):
        """Generate a human-readable description of an effect"""
        if effect_type == "eq":
            parts = []
            if "low" in parameters:
                direction = "boost" if parameters["low"] > 0 else "cut"
                parts.append(f"{abs(parameters['low'])}dB {direction} to bass")
            if "mid" in parameters:
                direction = "boost" if parameters["mid"] > 0 else "cut"
                parts.append(f"{abs(parameters['mid'])}dB {direction} to mids")
            if "high" in parameters:
                direction = "boost" if parameters["high"] > 0 else "cut"
                parts.append(f"{abs(parameters['high'])}dB {direction} to treble")
            return f"Applied EQ: {', '.join(parts)}"
            
        elif effect_type == "compression":
            return f"Applied compression: {parameters['threshold']}dB threshold, {parameters['ratio']}:1 ratio, {parameters['attack']}ms attack, {parameters['release']}ms release"
            
        elif effect_type == "reverb":
            room_percent = int(parameters['room_size'] * 100)
            wet_percent = int(parameters['wet_level'] * 100)
            return f"Added reverb: {room_percent}% room size, {wet_percent}% wet signal"
            
        elif effect_type == "noise_reduction":
            strength_percent = int(parameters['strength'] * 100)
            return f"Applied noise reduction: {strength_percent}% strength"
            
        elif effect_type == "delay":
            time_ms = int(parameters['time'] * 1000)
            feedback_percent = int(parameters['feedback'] * 100)
            mix_percent = int(parameters['mix'] * 100)
            return f"Added delay: {time_ms}ms delay time, {feedback_percent}% feedback, {mix_percent}% mix"
            
        elif effect_type == "pitch_shift":
            direction = "up" if parameters['semitones'] > 0 else "down"
            return f"Shifted pitch {direction} by {abs(parameters['semitones'])} semitones"
            
        elif effect_type == "time_stretch":
            if parameters['rate'] > 1:
                percent = int((parameters['rate'] - 1) * 100)
                return f"Sped up by {percent}%"
            else:
                percent = int((1 - parameters['rate']) * 100)
                return f"Slowed down by {percent}%"
                
        elif effect_type == "stereo_width":
            if parameters['width'] == 0:
                return "Converted to mono"
            elif parameters['width'] < 1:
                percent = int((1 - parameters['width']) * 100)
                return f"Narrowed stereo width by {percent}%"
            else:
                percent = int((parameters['width'] - 1) * 100)
                return f"Widened stereo width by {percent}%"
                
        elif effect_type == "limiter":
            if parameters['gain'] > 0:
                return f"Maximized loudness: +{parameters['gain']}dB gain, {parameters['threshold']}dB limit"
            else:
                return f"Reduced volume by {abs(parameters['gain'])}dB"
                
        elif effect_type == "distortion":
            return f"Added {'subtle' if parameters['drive'] < 2 else 'moderate' if parameters['drive'] < 4 else 'heavy'} distortion"
            
        elif effect_type == "filter":
            if parameters['type'] == "lowpass":
                return f"Applied lowpass filter at {parameters['cutoff_high']}Hz"
            elif parameters['type'] == "highpass":
                return f"Applied highpass filter at {parameters['cutoff_low']}Hz"
            else:
                return f"Applied bandpass filter from {parameters['cutoff_low']}Hz to {parameters['cutoff_high']}Hz"
                
        else:
            return f"Applied {effect_type}"
    
    # Effect implementation methods
    def apply_eq(self, audio_data, sample_rate, parameters):
        """Apply equalization to audio data"""
        try:
            # Create a copy of the audio data
            processed_audio = audio_data.copy()
            
            # Define frequency bands
            bands = {
                "low": (20, 250),
                "low_mid": (250, 1000),
                "mid": (500, 2000),
                "high_mid": (1000, 5000),
                "high": (5000, 20000)
            }
            
            # Apply EQ for each band
            for band, value in parameters.items():
                if band in bands and value != 0:
                    # Get band frequency range
                    low_freq, high_freq = bands[band]
                    
                    # Convert to linear gain
                    gain = 10 ** (value / 20)
                    
                    # Design bandpass filter for this frequency range
                    nyquist = sample_rate / 2
                    low_normalized = low_freq / nyquist
                    high_normalized = high_freq / nyquist
                    
                    # For low band, use low shelf
                    if band == "low":
                        b, a = signal.butter(2, high_normalized, btype='lowpass')
                    # For high band, use high shelf
                    elif band == "high":
                        b, a = signal.butter(2, low_normalized, btype='highpass')
                    # For mid bands, use bandpass
                    else:
                        b, a = signal.butter(2, [low_normalized, high_normalized], btype='bandpass')
                    
                    # Apply filter to get the band
                    band_audio = signal.lfilter(b, a, processed_audio)
                    
                    # Apply gain to the band and add back to the signal
                    processed_audio = processed_audio + (band_audio * (gain - 1))
            
            # Prevent clipping
            if np.max(np.abs(processed_audio)) > 0.99:
                processed_audio = processed_audio / np.max(np.abs(processed_audio)) * 0.99
                
            return processed_audio
            
        except Exception as e:
            logger.error(f"Error applying EQ: {str(e)}")
            return audio_data
    
    def apply_compression(self, audio_data, sample_rate, parameters):
        """Apply dynamic range compression to audio data"""
        try:
            # Extract parameters
            threshold = parameters.get('threshold', -20)
            ratio = parameters.get('ratio', 4)
            attack_ms = parameters.get('attack', 20)
            release_ms = parameters.get('release', 250)
            
            # Convert to linear values
            threshold_linear = 10 ** (threshold / 20)
            attack_samples = int(attack_ms * sample_rate / 1000)
            release_samples = int(release_ms * sample_rate / 1000)
            
            # Make attack and release at least 1 sample
            attack_samples = max(1, attack_samples)
            release_samples = max(1, release_samples)
            
            # Initialize gain reduction and output arrays
            gain_reduction = np.ones_like(audio_data)
            output = np.zeros_like(audio_data)
            
            # Apply compression sample by sample
            for i in range(len(audio_data)):
                # Calculate instantaneous gain reduction
                input_level = np.abs(audio_data[i])
                if input_level > threshold_linear:
                    target_gain = (input_level / threshold_linear) ** (1/ratio - 1)
                else:
                    target_gain = 1.0
                
                # Apply attack/release smoothing
                if target_gain < gain_reduction[i-1] if i > 0 else 1.0:
                    # Attack phase
                    if i > 0:
                        gain_reduction[i] = gain_reduction[i-1] + (target_gain - gain_reduction[i-1]) / attack_samples
                    else:
                        gain_reduction[i] = target_gain
                else:
                    # Release phase
                    if i > 0:
                        gain_reduction[i] = gain_reduction[i-1] + (target_gain - gain_reduction[i-1]) / release_samples
                    else:
                        gain_reduction[i] = target_gain
                
                # Apply gain reduction
                output[i] = audio_data[i] * gain_reduction[i]
            
            # Apply makeup gain to bring level back up
            makeup_gain = 1 / (10 ** (threshold / 20) * (1 - 1/ratio))
            output = output * makeup_gain
            
            # Prevent clipping
            if np.max(np.abs(output)) > 0.99:
                output = output / np.max(np.abs(output)) * 0.99
                
            return output
            
        except Exception as e:
            logger.error(f"Error applying compression: {str(e)}")
            return audio_data
    
    def apply_reverb(self, audio_data, sample_rate, parameters):
        """Apply reverb effect to audio data"""
        try:
            # Extract parameters
            room_size = parameters.get('room_size', 0.5)
            damping = parameters.get('damping', 0.5)
            wet_level = parameters.get('wet_level', 0.33)
            dry_level = parameters.get('dry_level', 0.7)
            
            # Calculate reverb time in samples
            reverb_time = int(room_size * sample_rate * 2)  # Up to 2 seconds for room_size=1.0
            
            # Create impulse response
            impulse_response = np.zeros(reverb_time)
            decay = np.linspace(1, 0, reverb_time) ** damping
            impulse_response = decay * np.random.randn(reverb_time) * 0.5
            
            # Apply convolution
            wet_signal = signal.convolve(audio_data, impulse_response, mode='full')[:len(audio_data)]
            
            # Mix dry and wet signals
            output = dry_level * audio_data + wet_level * wet_signal
            
            # Normalize to prevent clipping
            if np.max(np.abs(output)) > 0.99:
                output = output / np.max(np.abs(output)) * 0.99
                
            return output
            
        except Exception as e:
            logger.error(f"Error applying reverb: {str(e)}")
            return audio_data
    
    def apply_noise_reduction(self, audio_data, sample_rate, parameters):
        """Apply noise reduction to audio data"""
        try:
            # Extract parameters
            strength = parameters.get('strength', 0.5)
            sensitivity = parameters.get('sensitivity', 0.5)
            
            # Simple spectral gating noise reduction
            # In a real implementation, we would use a more sophisticated algorithm
            
            # Convert to frequency domain
            stft = librosa.stft(audio_data)
            magnitude = np.abs(stft)
            phase = np.angle(stft)
            
            # Estimate noise profile from the quietest frames
            noise_profile = np.percentile(magnitude, sensitivity * 10, axis=1)
            noise_profile = noise_profile.reshape(-1, 1)
            
            # Apply spectral gating
            gain = 1 - (noise_profile / (magnitude + 1e-10))
            gain = np.maximum(0, gain)
            gain = gain ** strength
            
            # Apply gain to magnitude
            magnitude_reduced = magnitude * gain
            
            # Convert back to time domain
            stft_reduced = magnitude_reduced * np.exp(1j * phase)
            output = librosa.istft(stft_reduced, length=len(audio_data))
            
            return output
            
        except Exception as e:
            logger.error(f"Error applying noise reduction: {str(e)}")
            return audio_data
    
    def apply_delay(self, audio_data, sample_rate, parameters):
        """Apply delay/echo effect to audio data"""
        try:
            # Extract parameters
            delay_time = parameters.get('time', 0.25)  # in seconds
            feedback = parameters.get('feedback', 0.3)
            mix = parameters.get('mix', 0.3)
            
            # Calculate delay in samples
            delay_samples = int(delay_time * sample_rate)
            
            # Create output buffer
            output = audio_data.copy()
            
            # Apply delay with feedback
            delay_buffer = np.zeros_like(audio_data)
            
            # Simple implementation with limited feedback iterations
            for i in range(1, 6):  # Limit to 5 feedback iterations
                # Calculate delay for this iteration
                this_delay = delay_samples * i
                
                # Skip if delay is longer than the audio
                if this_delay >= len(audio_data):
                    break
                
                # Apply delay and feedback
                delay_gain = feedback ** (i - 1)
                delay_buffer[this_delay:] += audio_data[:len(audio_data)-this_delay] * delay_gain * mix
            
            # Mix original and delayed signal
            output = (1 - mix) * audio_data + delay_buffer
            
            # Prevent clipping
            if np.max(np.abs(output)) > 0.99:
                output = output / np.max(np.abs(output)) * 0.99
                
            return output
            
        except Exception as e:
            logger.error(f"Error applying delay: {str(e)}")
            return audio_data
    
    def apply_pitch_shift(self, audio_data, sample_rate, parameters):
        """Apply pitch shifting to audio data"""
        try:
            # Extract parameters
            semitones = parameters.get('semitones', 0)
            
            # Use librosa's pitch shift
            output = librosa.effects.pitch_shift(audio_data, sr=sample_rate, n_steps=semitones)
            
            return output
            
        except Exception as e:
            logger.error(f"Error applying pitch shift: {str(e)}")
            return audio_data
    
    def apply_time_stretch(self, audio_data, sample_rate, parameters):
        """Apply time stretching to audio data"""
        try:
            # Extract parameters
            rate = parameters.get('rate', 1.0)
            
            # Use librosa's time stretch
            output = librosa.effects.time_stretch(audio_data, rate=rate)
            
            # If the output is shorter than the input, pad with zeros
            if len(output) < len(audio_data):
                output = np.pad(output, (0, len(audio_data) - len(output)))
            # If the output is longer than the input, truncate
            elif len(output) > len(audio_data):
                output = output[:len(audio_data)]
                
            return output
            
        except Exception as e:
            logger.error(f"Error applying time stretch: {str(e)}")
            return audio_data
    
    def apply_stereo_width(self, audio_data, sample_rate, parameters):
        """Apply stereo width adjustment to audio data"""
        try:
            # Extract parameters
            width = parameters.get('width', 1.0)
            
            # If mono, return as is
            if len(audio_data.shape) == 1:
                return audio_data
                
            # If stereo, adjust width
            if len(audio_data.shape) == 2 and audio_data.shape[0] == 2:
                # Convert to mid-side
                mid = (audio_data[0] + audio_data[1]) / 2
                side = (audio_data[0] - audio_data[1]) / 2
                
                # Adjust side level to change width
                side = side * width
                
                # Convert back to left-right
                left = mid + side
                right = mid - side
                
                # Combine channels
                output = np.vstack((left, right))
                
                # Prevent clipping
                if np.max(np.abs(output)) > 0.99:
                    output = output / np.max(np.abs(output)) * 0.99
                    
                return output
                
            # If more than 2 channels, just return original
            return audio_data
            
        except Exception as e:
            logger.error(f"Error applying stereo width: {str(e)}")
            return audio_data
    
    def apply_limiter(self, audio_data, sample_rate, parameters):
        """Apply limiting and gain to audio data"""
        try:
            # Extract parameters
            gain_db = parameters.get('gain', 0)
            threshold_db = parameters.get('threshold', -0.3)
            release_ms = parameters.get('release', 50)
            
            # Convert to linear values
            gain_linear = 10 ** (gain_db / 20)
            threshold_linear = 10 ** (threshold_db / 20)
            release_samples = int(release_ms * sample_rate / 1000)
            
            # Apply gain
            output = audio_data * gain_linear
            
            # Apply limiting
            gain_reduction = np.ones_like(output)
            
            # Calculate gain reduction needed
            for i in range(len(output)):
                input_level = np.abs(output[i])
                if input_level > threshold_linear:
                    target_gain = threshold_linear / input_level
                else:
                    target_gain = 1.0
                
                # Apply release smoothing
                if i > 0:
                    gain_reduction[i] = min(1.0, gain_reduction[i-1] + (1.0 - gain_reduction[i-1]) / release_samples)
                    gain_reduction[i] = min(gain_reduction[i], target_gain)
                else:
                    gain_reduction[i] = target_gain
                
                # Apply gain reduction
                output[i] = output[i] * gain_reduction[i]
            
            return output
            
        except Exception as e:
            logger.error(f"Error applying limiter: {str(e)}")
            return audio_data
    
    def apply_distortion(self, audio_data, sample_rate, parameters):
        """Apply distortion/saturation to audio data"""
        try:
            # Extract parameters
            drive = parameters.get('drive', 2.0)
            mix = parameters.get('mix', 0.5)
            
            # Apply soft clipping distortion
            # Normalize input to prevent excessive distortion
            normalized = audio_data / (np.max(np.abs(audio_data)) + 1e-10)
            
            # Apply drive
            driven = normalized * drive
            
            # Apply soft clipping function (tanh)
            distorted = np.tanh(driven)
            
            # Mix with dry signal
            output = (1 - mix) * normalized + mix * distorted
            
            # Normalize output level to match input level
            output = output * (np.max(np.abs(audio_data)) + 1e-10)
            
            # Prevent clipping
            if np.max(np.abs(output)) > 0.99:
                output = output / np.max(np.abs(output)) * 0.99
                
            return output
            
        except Exception as e:
            logger.error(f"Error applying distortion: {str(e)}")
            return audio_data
    
    def apply_filter(self, audio_data, sample_rate, parameters):
        """Apply filter effects to audio data"""
        try:
            # Extract parameters
            filter_type = parameters.get('type', 'bandpass')
            cutoff_low = parameters.get('cutoff_low', 500)
            cutoff_high = parameters.get('cutoff_high', 3000)
            resonance = parameters.get('resonance', 0.7)
            
            # Normalize cutoff frequencies
            nyquist = sample_rate / 2
            low_normalized = cutoff_low / nyquist
            high_normalized = cutoff_high / nyquist
            
            # Design filter based on type
            if filter_type == 'lowpass':
                b, a = signal.butter(2, high_normalized, btype='lowpass')
            elif filter_type == 'highpass':
                b, a = signal.butter(2, low_normalized, btype='highpass')
            else:  # bandpass
                b, a = signal.butter(2, [low_normalized, high_normalized], btype='bandpass')
            
            # Apply filter
            output = signal.lfilter(b, a, audio_data)
            
            return output
            
        except Exception as e:
            logger.error(f"Error applying filter: {str(e)}")
            return audio_data
    
    def apply_gate(self, audio_data, sample_rate, parameters):
        """Apply noise gate to audio data"""
        try:
            # Extract parameters
            threshold_db = parameters.get('threshold', -40)
            ratio = parameters.get('ratio', 10)
            attack_ms = parameters.get('attack', 1)
            release_ms = parameters.get('release', 100)
            
            # Convert to linear values
            threshold_linear = 10 ** (threshold_db / 20)
            attack_samples = int(attack_ms * sample_rate / 1000)
            release_samples = int(release_ms * sample_rate / 1000)
            
            # Make attack and release at least 1 sample
            attack_samples = max(1, attack_samples)
            release_samples = max(1, release_samples)
            
            # Initialize gain and output arrays
            gain = np.ones_like(audio_data)
            output = np.zeros_like(audio_data)
            
            # Apply gate sample by sample
            for i in range(len(audio_data)):
                # Calculate instantaneous gain
                input_level = np.abs(audio_data[i])
                if input_level < threshold_linear:
                    target_gain = (input_level / threshold_linear) ** ratio
                else:
                    target_gain = 1.0
                
                # Apply attack/release smoothing
                if target_gain < gain[i-1] if i > 0 else 1.0:
                    # Attack phase
                    if i > 0:
                        gain[i] = gain[i-1] + (target_gain - gain[i-1]) / attack_samples
                    else:
                        gain[i] = target_gain
                else:
                    # Release phase
                    if i > 0:
                        gain[i] = gain[i-1] + (target_gain - gain[i-1]) / release_samples
                    else:
                        gain[i] = target_gain
                
                # Apply gain
                output[i] = audio_data[i] * gain[i]
            
            return output
            
        except Exception as e:
            logger.error(f"Error applying gate: {str(e)}")
            return audio_data

# Create a singleton instance
audio_processor = AudioProcessor()