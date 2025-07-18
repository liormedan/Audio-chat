"""Basic audio effect implementations used by the API routes."""
from __future__ import annotations

import logging
import numpy as np
from scipy import signal

logger = logging.getLogger(__name__)


def apply_eq(audio_data, sample_rate, parameters):
    """Apply a simple EQ to the provided audio data."""
    try:
        import librosa

        low_shelf = parameters.get('low_shelf', 0)
        low_mid = parameters.get('low_mid', 0)
        mid = parameters.get('mid', 0)
        high_mid = parameters.get('high_mid', 0)
        high = parameters.get('high', 0)

        if low_shelf != 0:
            low_mask = librosa.filters.mr_frequencies(sample_rate) < 250
            audio_data[:, low_mask] = audio_data[:, low_mask] * (10 ** (low_shelf / 20))

        # Additional bands could be handled here
        return audio_data
    except Exception as e:
        logger.error(f"Error applying EQ: {str(e)}")
        return audio_data


def apply_compression(audio_data, parameters):
    """Apply dynamic range compression."""
    try:
        threshold = parameters.get('threshold', -20)
        ratio = parameters.get('ratio', 4)
        attack = parameters.get('attack', 5)
        release = parameters.get('release', 50)

        threshold_linear = 10 ** (threshold / 20)
        gain_reduction = np.zeros_like(audio_data)
        for i in range(len(audio_data)):
            if abs(audio_data[i]) > threshold_linear:
                gain_reduction[i] = abs(audio_data[i]) / threshold_linear
                gain_reduction[i] = gain_reduction[i] ** (1/ratio - 1)
            else:
                gain_reduction[i] = 1.0

        compressed_audio = audio_data * gain_reduction
        return compressed_audio
    except Exception as e:
        logger.error(f"Error applying compression: {str(e)}")
        return audio_data


def apply_reverb(audio_data, sample_rate, parameters):
    """Apply a basic reverb effect."""
    try:
        room_size = parameters.get('room_size', 0.5)
        damping = parameters.get('damping', 0.5)
        wet_level = parameters.get('wet_level', 0.33)
        dry_level = parameters.get('dry_level', 0.4)

        reverb_time = int(room_size * sample_rate)
        impulse_response = np.zeros(reverb_time)
        decay = np.linspace(1, 0, reverb_time) ** damping
        impulse_response = decay * np.random.randn(reverb_time)

        reverb_audio = signal.convolve(audio_data, impulse_response, mode='full')[:len(audio_data)]
        output = dry_level * audio_data + wet_level * reverb_audio

        if np.max(np.abs(output)) > 1.0:
            output = output / np.max(np.abs(output))
        return output
    except Exception as e:
        logger.error(f"Error applying reverb: {str(e)}")
        return audio_data
