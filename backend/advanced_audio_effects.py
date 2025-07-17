"""
Advanced Audio Effects Module using Pedalboard by Spotify

This module provides high-quality audio effects using the Pedalboard library,
which is built on professional-grade audio DSP algorithms.
"""

import numpy as np
import logging
from typing import Dict, Any, Tuple, Optional

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

class AdvancedAudioEffects:
    """Advanced audio effects processor using Pedalboard"""
    
    def __init__(self):
        self.pedalboard_available = PEDALBOARD_AVAILABLE
    
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