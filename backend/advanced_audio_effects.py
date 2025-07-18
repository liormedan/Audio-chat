"""
Advanced Audio Effects Module using Pedalboard by Spotify

This module provides high-quality audio effects using the Pedalboard library,
which is built on professional-grade audio DSP algorithms.
"""

import numpy as np
import logging
from typing import Dict, Any, Tuple, Optional, List

logger = logging.getLogger(__name__)

try:
    # Import Pedalboard for high-quality audio effects
    from pedalboard import Pedalboard, Compressor, Reverb, Delay, Gain, Distortion
    from pedalboard import Chorus, Phaser, LadderFilter, PitchShift
    from pedalboard.io import AudioFile
    PEDALBOARD_AVAILABLE = True
except ImportError:
    logger.warning("Pedalboard library not installed. Falling back to basic effects.")
    PEDALBOARD_AVAILABLE = False

try:
    # Import Spleeter for source separation
    import tensorflow as tf
    from spleeter.separator import Separator
    SPLEETER_AVAILABLE = True
except ImportError:
    logger.warning("Spleeter not installed. Source separation will not be available.")
    SPLEETER_AVAILABLE = False

try:
    # Import librosa for advanced audio analysis
    import librosa
    import librosa.effects
    import librosa.decompose
    LIBROSA_AVAILABLE = True
except ImportError:
    logger.warning("Librosa not installed. Some advanced audio effects will not be available.")
    LIBROSA_AVAILABLE = False

class AdvancedAudioEffects:
    """Advanced audio effects processor using Pedalboard"""
    
    def __init__(self):
        self.pedalboard_available = PEDALBOARD_AVAILABLE
        self.spleeter_available = SPLEETER_AVAILABLE
        self.librosa_available = LIBROSA_AVAILABLE
        
        # Initialize Spleeter if available
        if self.spleeter_available:
            try:
                # Initialize with 2 stems (vocals and accompaniment)
                self.separator_2stems = Separator('spleeter:2stems')
                # Initialize with 4 stems (vocals, drums, bass, other)
                self.separator_4stems = Separator('spleeter:4stems')
                # Initialize with 5 stems (vocals, drums, bass, piano, other)
                self.separator_5stems = Separator('spleeter:5stems')
                logger.info("Spleeter initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Spleeter: {str(e)}")
                self.spleeter_available = False
    
    def process_with_pedalboard(self, audio_data: np.ndarray, sample_rate: int, 
                               effects_chain: list) -> np.ndarray:
        """
        Process audio with a chain of Pedalboard effects
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            effects_chain: List of effect configurations
            
        Returns:
            Processed audio as numpy array
        """
        if not self.pedalboard_available:
            logger.warning("Pedalboard not available. Returning original audio.")
            return audio_data
            
        try:
            # Create a new pedalboard
            board = Pedalboard()
            
            # Add effects to the pedalboard
            for effect in effects_chain:
                effect_type = effect.get('type')
                params = effect.get('parameters', {})
                
                if effect_type == 'eq':
                    # EQ is handled as a combination of filters in Pedalboard
                    self._add_eq_to_board(board, params)
                elif effect_type == 'compression':
                    board.append(self._create_compressor(params))
                elif effect_type == 'reverb':
                    board.append(self._create_reverb(params))
                elif effect_type == 'delay':
                    board.append(self._create_delay(params))
                elif effect_type == 'distortion':
                    board.append(self._create_distortion(params))
                elif effect_type == 'chorus':
                    board.append(self._create_chorus(params))
                elif effect_type == 'phaser':
                    board.append(self._create_phaser(params))
                elif effect_type == 'filter':
                    board.append(self._create_filter(params))
                elif effect_type == 'pitch_shift':
                    board.append(self._create_pitch_shift(params))
                elif effect_type == 'gain':
                    board.append(Gain(gain_db=params.get('gain_db', 0)))
            
            # Process the audio
            # Convert to float32 if needed (Pedalboard expects float32)
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)
                
            # Ensure audio is in the right shape for Pedalboard
            # Pedalboard expects shape (channels, samples) but librosa uses (samples, channels)
            if len(audio_data.shape) == 1:  # Mono
                audio_data_pb = audio_data.reshape(1, -1)
            else:  # Stereo or multi-channel
                audio_data_pb = audio_data.T
                
            # Process the audio
            processed_audio = board.process(audio_data_pb, sample_rate)
            
            # Convert back to librosa's format
            if len(processed_audio.shape) == 2:  # Multi-channel
                processed_audio = processed_audio.T
            else:  # Mono
                processed_audio = processed_audio.reshape(-1)
                
            return processed_audio
            
        except Exception as e:
            logger.error(f"Error processing with Pedalboard: {str(e)}")
            return audio_data
    
    def separate_sources(self, audio_data: np.ndarray, sample_rate: int, 
                        mode: str = '2stems') -> Dict[str, np.ndarray]:
        """
        Separate audio into different sources (vocals, accompaniment, etc.)
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            mode: Separation mode ('2stems', '4stems', or '5stems')
            
        Returns:
            Dictionary of separated sources
        """
        if not self.spleeter_available:
            logger.warning("Spleeter not available. Returning original audio.")
            return {"original": audio_data}
            
        try:
            # Ensure audio is in the right format for Spleeter
            # Spleeter expects shape (samples, channels)
            if len(audio_data.shape) == 1:  # Mono
                audio_data_spleeter = np.stack([audio_data, audio_data], axis=1)
            else:  # Stereo or multi-channel
                if audio_data.shape[1] == 2:  # Already in (samples, channels) format
                    audio_data_spleeter = audio_data
                else:  # Convert from (channels, samples) to (samples, channels)
                    audio_data_spleeter = audio_data.T
                    
                # Ensure we have 2 channels (stereo)
                if audio_data_spleeter.shape[1] == 1:  # Mono
                    audio_data_spleeter = np.tile(audio_data_spleeter, (1, 2))
                elif audio_data_spleeter.shape[1] > 2:  # More than 2 channels
                    audio_data_spleeter = audio_data_spleeter[:, :2]
            
            # Choose the appropriate separator based on mode
            if mode == '4stems':
                separator = self.separator_4stems
            elif mode == '5stems':
                separator = self.separator_5stems
            else:  # Default to 2stems
                separator = self.separator_2stems
            
            # Separate sources
            waveform = audio_data_spleeter.T  # Spleeter expects (channels, samples)
            prediction = separator.separate(waveform)
            
            # Convert back to librosa's format (samples,) or (samples, channels)
            result = {}
            for source_name, source_data in prediction.items():
                # Convert from (channels, samples) to (samples, channels)
                source_data = source_data.T
                
                # If original was mono, convert back to mono
                if len(audio_data.shape) == 1:
                    source_data = np.mean(source_data, axis=1)
                
                result[source_name] = source_data
            
            return result
            
        except Exception as e:
            logger.error(f"Error separating sources: {str(e)}")
            return {"original": audio_data}
    
    def enhance_vocals(self, audio_data: np.ndarray, sample_rate: int, 
                      strength: float = 0.5) -> np.ndarray:
        """
        Enhance vocals in audio
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            strength: Enhancement strength (0.0 to 1.0)
            
        Returns:
            Processed audio as numpy array
        """
        if not self.spleeter_available:
            logger.warning("Spleeter not available. Cannot enhance vocals.")
            return audio_data
            
        try:
            # Separate vocals and accompaniment
            sources = self.separate_sources(audio_data, sample_rate, '2stems')
            
            if 'vocals' not in sources or 'accompaniment' not in sources:
                logger.warning("Vocal separation failed. Returning original audio.")
                return audio_data
            
            vocals = sources['vocals']
            accompaniment = sources['accompaniment']
            
            # Apply compression to vocals to make them more present
            vocal_effects = [
                {'type': 'compression', 'parameters': {'threshold': -20, 'ratio': 4, 'attack': 5, 'release': 50}},
                {'type': 'eq', 'parameters': {'high_mid': 3, 'high': 2}}  # Boost presence
            ]
            
            enhanced_vocals = self.process_with_pedalboard(vocals, sample_rate, vocal_effects)
            
            # Mix enhanced vocals with accompaniment
            # Adjust vocal level based on strength parameter
            vocal_gain = 1.0 + strength
            accompaniment_gain = 1.0 - (strength * 0.3)  # Reduce accompaniment slightly as vocals increase
            
            # Mix
            mixed = (enhanced_vocals * vocal_gain + accompaniment * accompaniment_gain) / 2
            
            # Prevent clipping
            if np.max(np.abs(mixed)) > 0.99:
                mixed = mixed / np.max(np.abs(mixed)) * 0.99
            
            return mixed
            
        except Exception as e:
            logger.error(f"Error enhancing vocals: {str(e)}")
            return audio_data
    
    def isolate_instrument(self, audio_data: np.ndarray, sample_rate: int, 
                          instrument: str = 'vocals') -> np.ndarray:
        """
        Isolate a specific instrument from audio
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            instrument: Instrument to isolate ('vocals', 'drums', 'bass', 'piano', 'other')
            
        Returns:
            Isolated instrument audio as numpy array
        """
        if not self.spleeter_available:
            logger.warning("Spleeter not available. Cannot isolate instrument.")
            return audio_data
            
        try:
            # Choose the appropriate separator based on the instrument
            if instrument in ['drums', 'bass', 'other']:
                mode = '4stems'
            elif instrument == 'piano':
                mode = '5stems'
            else:  # vocals
                mode = '2stems'
                
            # Separate sources
            sources = self.separate_sources(audio_data, sample_rate, mode)
            
            # Return the requested instrument if available
            if instrument in sources:
                return sources[instrument]
            elif instrument == 'vocals' and 'vocals' in sources:
                return sources['vocals']
            else:
                logger.warning(f"Instrument {instrument} not found in separated sources.")
                return audio_data
                
        except Exception as e:
            logger.error(f"Error isolating instrument: {str(e)}")
            return audio_data
    
    def remove_instrument(self, audio_data: np.ndarray, sample_rate: int, 
                         instrument: str = 'vocals') -> np.ndarray:
        """
        Remove a specific instrument from audio
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            instrument: Instrument to remove ('vocals', 'drums', 'bass', 'piano', 'other')
            
        Returns:
            Audio with instrument removed as numpy array
        """
        if not self.spleeter_available:
            logger.warning("Spleeter not available. Cannot remove instrument.")
            return audio_data
            
        try:
            # Choose the appropriate separator based on the instrument
            if instrument in ['drums', 'bass', 'other']:
                mode = '4stems'
            elif instrument == 'piano':
                mode = '5stems'
            else:  # vocals
                mode = '2stems'
                
            # Separate sources
            sources = self.separate_sources(audio_data, sample_rate, mode)
            
            # For vocals, we can just return the accompaniment
            if instrument == 'vocals' and 'accompaniment' in sources:
                return sources['accompaniment']
                
            # For other instruments, we need to mix all sources except the one to remove
            result = None
            for source_name, source_data in sources.items():
                if source_name != instrument and source_name != 'original':
                    if result is None:
                        result = source_data.copy()
                    else:
                        result += source_data
            
            # If we couldn't remove the instrument, return the original
            if result is None:
                logger.warning(f"Could not remove instrument {instrument}.")
                return audio_data
                
            # Normalize to prevent clipping
            if np.max(np.abs(result)) > 0.99:
                result = result / np.max(np.abs(result)) * 0.99
                
            return result
                
        except Exception as e:
            logger.error(f"Error removing instrument: {str(e)}")
            return audio_data
    
    def denoise_audio(self, audio_data: np.ndarray, sample_rate: int, 
                     strength: float = 0.5) -> np.ndarray:
        """
        Remove noise from audio using spectral gating
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            strength: Denoising strength (0.0 to 1.0)
            
        Returns:
            Denoised audio as numpy array
        """
        if not self.librosa_available:
            logger.warning("Librosa not available. Cannot denoise audio.")
            return audio_data
            
        try:
            # Convert to mono if stereo
            if len(audio_data.shape) > 1:
                audio_mono = np.mean(audio_data, axis=1)
            else:
                audio_mono = audio_data
                
            # Compute spectrogram
            stft = librosa.stft(audio_mono)
            magnitude = np.abs(stft)
            phase = np.angle(stft)
            
            # Estimate noise profile from the quietest frames
            noise_threshold = np.percentile(magnitude, 5, axis=1)
            noise_threshold = noise_threshold.reshape(-1, 1)
            
            # Apply spectral gating
            mask = (magnitude > noise_threshold * (1 + strength * 3))
            
            # Apply mask to spectrogram
            magnitude_denoised = magnitude * mask
            
            # Reconstruct audio
            stft_denoised = magnitude_denoised * np.exp(1j * phase)
            audio_denoised = librosa.istft(stft_denoised, length=len(audio_mono))
            
            # If original was stereo, convert back to stereo
            if len(audio_data.shape) > 1:
                audio_denoised = np.tile(audio_denoised.reshape(-1, 1), (1, audio_data.shape[1]))
                
            return audio_denoised
                
        except Exception as e:
            logger.error(f"Error denoising audio: {str(e)}")
            return audio_data
    
    def harmonize_audio(self, audio_data: np.ndarray, sample_rate: int, 
                       semitones: List[int] = [4, 7]) -> np.ndarray:
        """
        Add harmonies to audio (primarily for vocals)
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            semitones: List of semitone shifts for harmonies
            
        Returns:
            Harmonized audio as numpy array
        """
        if not self.spleeter_available or not self.librosa_available:
            logger.warning("Spleeter or Librosa not available. Cannot harmonize audio.")
            return audio_data
            
        try:
            # Separate vocals and accompaniment
            sources = self.separate_sources(audio_data, sample_rate, '2stems')
            
            if 'vocals' not in sources or 'accompaniment' not in sources:
                logger.warning("Vocal separation failed. Returning original audio.")
                return audio_data
            
            vocals = sources['vocals']
            accompaniment = sources['accompaniment']
            
            # Create harmonies by pitch shifting
            harmonies = []
            for semitone in semitones:
                harmony = librosa.effects.pitch_shift(vocals, sr=sample_rate, n_steps=semitone)
                harmonies.append(harmony * 0.6)  # Reduce volume of harmonies
            
            # Mix original vocals with harmonies
            mixed_vocals = vocals.copy()
            for harmony in harmonies:
                mixed_vocals += harmony
                
            # Normalize vocals to prevent clipping
            if np.max(np.abs(mixed_vocals)) > 0.99:
                mixed_vocals = mixed_vocals / np.max(np.abs(mixed_vocals)) * 0.99
            
            # Mix harmonized vocals with accompaniment
            result = mixed_vocals + accompaniment
            
            # Normalize final mix to prevent clipping
            if np.max(np.abs(result)) > 0.99:
                result = result / np.max(np.abs(result)) * 0.99
                
            return result
                
        except Exception as e:
            logger.error(f"Error harmonizing audio: {str(e)}")
            return audio_data
    
    def _add_eq_to_board(self, board: Pedalboard, params: Dict[str, Any]) -> None:
        """Add EQ effects to the pedalboard"""
        # Low shelf
        if 'low' in params and params['low'] != 0:
            board.append(LadderFilter(
                mode=LadderFilter.Mode.LOW_SHELF,
                cutoff_hz=250,
                resonance=0.7,
                gain_db=params['low']
            ))
        
        # Low mid
        if 'low_mid' in params and params['low_mid'] != 0:
            board.append(LadderFilter(
                mode=LadderFilter.Mode.BAND_SHELF,
                cutoff_hz=500,
                resonance=0.7,
                gain_db=params['low_mid']
            ))
        
        # Mid
        if 'mid' in params and params['mid'] != 0:
            board.append(LadderFilter(
                mode=LadderFilter.Mode.BAND_SHELF,
                cutoff_hz=1000,
                resonance=0.7,
                gain_db=params['mid']
            ))
        
        # High mid
        if 'high_mid' in params and params['high_mid'] != 0:
            board.append(LadderFilter(
                mode=LadderFilter.Mode.BAND_SHELF,
                cutoff_hz=2500,
                resonance=0.7,
                gain_db=params['high_mid']
            ))
        
        # High shelf
        if 'high' in params and params['high'] != 0:
            board.append(LadderFilter(
                mode=LadderFilter.Mode.HIGH_SHELF,
                cutoff_hz=5000,
                resonance=0.7,
                gain_db=params['high']
            ))
    
    def _create_compressor(self, params: Dict[str, Any]) -> Compressor:
        """Create a compressor effect"""
        return Compressor(
            threshold_db=params.get('threshold', -20),
            ratio=params.get('ratio', 4),
            attack_ms=params.get('attack', 20),
            release_ms=params.get('release', 250)
        )
    
    def _create_reverb(self, params: Dict[str, Any]) -> Reverb:
        """Create a reverb effect"""
        return Reverb(
            room_size=params.get('room_size', 0.5),
            damping=params.get('damping', 0.5),
            wet_level=params.get('wet_level', 0.33),
            dry_level=params.get('dry_level', 0.7),
            width=params.get('width', 1.0),
            freeze_mode=params.get('freeze_mode', 0.0)
        )
    
    def _create_delay(self, params: Dict[str, Any]) -> Delay:
        """Create a delay effect"""
        return Delay(
            delay_seconds=params.get('time', 0.25),
            feedback=params.get('feedback', 0.3),
            mix=params.get('mix', 0.3)
        )
    
    def _create_distortion(self, params: Dict[str, Any]) -> Distortion:
        """Create a distortion effect"""
        return Distortion(
            drive_db=20 * np.log10(params.get('drive', 2.0)),  # Convert from linear to dB
        )
    
    def _create_chorus(self, params: Dict[str, Any]) -> Chorus:
        """Create a chorus effect"""
        return Chorus(
            rate_hz=params.get('rate', 1.0),
            depth=params.get('depth', 0.25),
            centre_delay_ms=params.get('delay', 7.0),
            feedback=params.get('feedback', 0.0),
            mix=params.get('mix', 0.5)
        )
    
    def _create_phaser(self, params: Dict[str, Any]) -> Phaser:
        """Create a phaser effect"""
        return Phaser(
            rate_hz=params.get('rate', 1.0),
            depth=params.get('depth', 0.5),
            centre_frequency_hz=params.get('center_freq', 1300),
            feedback=params.get('feedback', 0.0),
            mix=params.get('mix', 0.5)
        )
    
    def _create_filter(self, params: Dict[str, Any]) -> LadderFilter:
        """Create a filter effect"""
        filter_type = params.get('type', 'bandpass')
        
        if filter_type == 'lowpass':
            mode = LadderFilter.Mode.LOW_PASS
            cutoff = params.get('cutoff_high', 1000)
        elif filter_type == 'highpass':
            mode = LadderFilter.Mode.HIGH_PASS
            cutoff = params.get('cutoff_low', 1000)
        else:  # bandpass
            mode = LadderFilter.Mode.BAND_PASS
            cutoff = (params.get('cutoff_low', 500) + params.get('cutoff_high', 3000)) / 2
        
        return LadderFilter(
            mode=mode,
            cutoff_hz=cutoff,
            resonance=params.get('resonance', 0.7)
        )
    
    def _create_pitch_shift(self, params: Dict[str, Any]) -> PitchShift:
        """Create a pitch shift effect"""
        return PitchShift(
            semitones=params.get('semitones', 0)
        )

# Create singleton instance
advanced_effects = AdvancedAudioEffects()