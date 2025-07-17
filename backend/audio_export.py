"""
Audio Export Module

This module provides functions for exporting audio in various formats
with different quality settings.
"""

import os
import numpy as np
import soundfile as sf
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    import ffmpeg
    from pydub import AudioSegment
    ADVANCED_EXPORT_AVAILABLE = True
except ImportError:
    logger.warning("ffmpeg or pydub not installed. Some export formats may not be available.")
    ADVANCED_EXPORT_AVAILABLE = False

class AudioExporter:
    """Audio exporter for various formats and quality settings"""
    
    def __init__(self, export_dir: Path):
        self.export_dir = export_dir
        self.export_dir.mkdir(exist_ok=True)
        self.advanced_export_available = ADVANCED_EXPORT_AVAILABLE
    
    def export_audio(self, audio_data: np.ndarray, sample_rate: int, 
                    file_id: str, format: str = 'wav', 
                    quality: str = 'high') -> Dict[str, Any]:
        """
        Export audio in the specified format and quality
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate in Hz
            file_id: Unique identifier for the file
            format: Output format ('wav', 'mp3', 'flac', 'ogg', 'aac')
            quality: Quality setting ('low', 'medium', 'high')
            
        Returns:
            Dict with export details
        """
        try:
            # Normalize format string
            format = format.lower()
            
            # Validate format
            if format not in ['wav', 'mp3', 'flac', 'ogg', 'aac']:
                logger.warning(f"Unsupported format: {format}. Falling back to wav.")
                format = 'wav'
            
            # For formats other than wav, we need ffmpeg/pydub
            if format != 'wav' and not self.advanced_export_available:
                logger.warning(f"Format {format} requires ffmpeg/pydub. Falling back to wav.")
                format = 'wav'
            
            # Create output filename
            output_path = self.export_dir / f"{file_id}.{format}"
            
            # Export based on format
            if format == 'wav':
                return self._export_wav(audio_data, sample_rate, output_path, quality)
            else:
                return self._export_with_pydub(audio_data, sample_rate, output_path, format, quality)
                
        except Exception as e:
            logger.error(f"Error exporting audio: {str(e)}")
            # Fallback to WAV export
            output_path = self.export_dir / f"{file_id}.wav"
            return self._export_wav(audio_data, sample_rate, output_path, 'medium')
    
    def _export_wav(self, audio_data: np.ndarray, sample_rate: int, 
                   output_path: Path, quality: str) -> Dict[str, Any]:
        """Export audio in WAV format"""
        # Set bit depth based on quality
        if quality == 'low':
            subtype = 'PCM_16'  # 16-bit
        elif quality == 'medium':
            subtype = 'PCM_24'  # 24-bit
        else:  # high
            subtype = 'FLOAT'   # 32-bit float
        
        # Write the file
        sf.write(output_path, audio_data, sample_rate, subtype=subtype)
        
        # Get file size
        file_size = os.path.getsize(output_path)
        
        return {
            "path": str(output_path),
            "format": "wav",
            "quality": quality,
            "sample_rate": sample_rate,
            "bit_depth": 16 if subtype == 'PCM_16' else 24 if subtype == 'PCM_24' else 32,
            "file_size": file_size,
            "url": f"/audio/{output_path.name}"
        }
    
    def _export_with_pydub(self, audio_data: np.ndarray, sample_rate: int,
                          output_path: Path, format: str, quality: str) -> Dict[str, Any]:
        """Export audio using pydub for formats other than WAV"""
        # First save as temporary WAV
        temp_wav = self.export_dir / f"temp_{output_path.stem}.wav"
        sf.write(temp_wav, audio_data, sample_rate, subtype='FLOAT')
        
        # Load with pydub
        audio = AudioSegment.from_wav(temp_wav)
        
        # Set bitrate based on quality and format
        bitrate = self._get_bitrate(format, quality)
        
        # Export with pydub
        audio.export(
            output_path,
            format=format,
            bitrate=bitrate,
            parameters=["-q:a", self._get_quality_parameter(format, quality)]
        )
        
        # Delete temporary WAV
        os.remove(temp_wav)
        
        # Get file size
        file_size = os.path.getsize(output_path)
        
        return {
            "path": str(output_path),
            "format": format,
            "quality": quality,
            "sample_rate": sample_rate,
            "bitrate": bitrate,
            "file_size": file_size,
            "url": f"/audio/{output_path.name}"
        }
    
    def _get_bitrate(self, format: str, quality: str) -> str:
        """Get appropriate bitrate for format and quality"""
        if format == 'mp3':
            if quality == 'low':
                return "128k"
            elif quality == 'medium':
                return "192k"
            else:  # high
                return "320k"
        elif format == 'ogg':
            if quality == 'low':
                return "96k"
            elif quality == 'medium':
                return "160k"
            else:  # high
                return "256k"
        elif format == 'aac':
            if quality == 'low':
                return "128k"
            elif quality == 'medium':
                return "192k"
            else:  # high
                return "256k"
        else:  # flac or other
            return "320k"  # Not really used for FLAC
    
    def _get_quality_parameter(self, format: str, quality: str) -> str:
        """Get format-specific quality parameter"""
        if format == 'mp3':
            if quality == 'low':
                return "5"
            elif quality == 'medium':
                return "3"
            else:  # high
                return "0"
        elif format == 'ogg':
            if quality == 'low':
                return "3"
            elif quality == 'medium':
                return "6"
            else:  # high
                return "10"
        else:
            return "5"  # Default quality parameter

# Create singleton instance with processed directory
audio_exporter = AudioExporter(Path("processed"))