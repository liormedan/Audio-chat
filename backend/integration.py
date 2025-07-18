"""
Integration Module for AudioChat

This module integrates all the advanced components of the AudioChat system,
ensuring they work together seamlessly.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import all components
try:
    from audio_processing import audio_processor
    from advanced_audio_effects import advanced_effects
    from audio_export import audio_exporter
    from cache_manager import cache_manager
    from parallel_processor import parallel_processor
    from llm_processor import llm_processor
    
    COMPONENTS_AVAILABLE = True
except ImportError as e:
    logger.error(f"Error importing components: {str(e)}")
    COMPONENTS_AVAILABLE = False

class AudioChatSystem:
    """Main integration class for AudioChat system"""
    
    def __init__(self):
        """Initialize the AudioChat system"""
        self.components_available = COMPONENTS_AVAILABLE
        
        # Create necessary directories
        self.cache_dir = Path("cache")
        self.upload_dir = Path("uploads")
        self.processed_dir = Path("processed")
        
        self.cache_dir.mkdir(exist_ok=True)
        self.upload_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
        
        # Initialize system status
        self.status = self._check_system_status()
        
        logger.info(f"AudioChat system initialized with status: {self.status}")
    
    def _check_system_status(self) -> Dict[str, Any]:
        """Check the status of all system components"""
        status = {
            "components_available": self.components_available,
            "cache_available": hasattr(cache_manager, "cache_dir"),
            "parallel_processing_available": hasattr(parallel_processor, "max_workers"),
            "advanced_effects_available": False,
            "llm_available": False,
            "export_available": False,
            "directories": {
                "cache": self.cache_dir.exists(),
                "uploads": self.upload_dir.exists(),
                "processed": self.processed_dir.exists()
            }
        }
        
        # Check advanced effects
        if self.components_available:
            status["advanced_effects_available"] = advanced_effects.pedalboard_available
            status["source_separation_available"] = advanced_effects.spleeter_available
            
            # Check LLM
            status["llm_available"] = len(llm_processor.providers) > 0
            status["llm_providers"] = llm_processor.providers
            
            # Check export
            status["export_available"] = audio_exporter.advanced_export_available
            
            # Get cache stats
            status["cache_stats"] = cache_manager.get_cache_stats()
        
        return status
    
    def process_audio(self, audio_path: str, instructions: str, 
                     segment: Optional[Dict[str, float]] = None,
                     use_cache: bool = True) -> Tuple[str, List[str]]:
        """
        Process audio file with the integrated system
        
        Args:
            audio_path: Path to audio file
            instructions: Natural language instructions
            segment: Optional segment to process (start and end time in seconds)
            use_cache: Whether to use cache
            
        Returns:
            Tuple of (output_path, processing_steps)
        """
        if not self.components_available:
            raise RuntimeError("AudioChat components not available")
        
        try:
            # Load audio file
            import librosa
            import soundfile as sf
            import numpy as np
            import uuid
            
            logger.info(f"Processing audio file: {audio_path}")
            logger.info(f"Instructions: {instructions}")
            
            # Generate a unique ID for the file
            file_id = str(uuid.uuid4())
            
            # Check cache if enabled
            if use_cache:
                # Create a cache key based on file path and instructions
                import hashlib
                file_hash = hashlib.md5(open(audio_path, 'rb').read()).hexdigest()
                cache_key = f"{file_hash}_{instructions}"
                
                # Check if in cache
                cached_result = cache_manager.get_processed_audio(cache_key, instructions)
                if cached_result:
                    logger.info("Using cached result")
                    audio_data, sample_rate = cached_result
                    
                    # Save to output file
                    output_path = str(self.processed_dir / f"{file_id}.wav")
                    sf.write(output_path, audio_data, sample_rate)
                    
                    # Return cached processing steps
                    return output_path, ["Used cached result"]
            
            # Load the audio file
            y, sr = librosa.load(audio_path, sr=None)
            
            # Extract segment if specified
            full_audio = y.copy()
            if segment:
                start_time = segment.get("start", 0)
                end_time = segment.get("end", None)
                
                # Convert time to samples
                start_sample = int(start_time * sr)
                
                if end_time is not None:
                    end_sample = int(end_time * sr)
                    # Ensure end sample is within bounds
                    end_sample = min(end_sample, len(y))
                else:
                    end_sample = len(y)
                
                # Extract segment
                y = y[start_sample:end_sample]
                
                logger.info(f"Processing segment: {start_time}s to {end_time if end_time is not None else len(y)/sr}s")
            
            # Analyze the audio
            audio_analysis = audio_processor.analyze_audio(y, sr)
            
            # Process instructions with LLM if available
            if llm_processor.providers:
                logger.info("Using LLM for instruction processing")
                effects_chain = llm_processor.process_instructions(instructions, audio_analysis)
            else:
                logger.info("Using rule-based instruction processing")
                effects_chain = audio_processor.parse_instructions(instructions, audio_analysis)
            
            # Check if file is large enough for parallel processing
            is_large_file = len(y) > sr * 30  # Files longer than 30 seconds
            
            # Process the audio
            if is_large_file:
                logger.info("Using parallel processing for large file")
                processed_audio = parallel_processor.process_audio_with_effects_parallel(
                    y, sr, effects_chain
                )
            else:
                logger.info("Using standard processing")
                processed_audio, _ = audio_processor.process_audio(
                    y, sr, instructions, effects_chain
                )
            
            # If we processed a segment, merge it back into the full audio
            if segment:
                start_sample = int(segment["start"] * sr)
                end_sample = start_sample + len(processed_audio)
                
                # Create a copy of the full audio and replace the segment
                merged_audio = full_audio.copy()
                merged_audio[start_sample:end_sample] = processed_audio
                processed_audio = merged_audio
            
            # Cache the result if enabled
            if use_cache:
                cache_manager.cache_processed_audio(
                    cache_key,
                    instructions,
                    processed_audio,
                    sr
                )
            
            # Save the processed audio
            output_path = str(self.processed_dir / f"{file_id}.wav")
            sf.write(output_path, processed_audio, sr)
            
            # Generate processing steps descriptions
            processing_steps = [audio_processor.describe_effect(effect["type"], effect["parameters"]) 
                               for effect in effects_chain]
            
            return output_path, processing_steps
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            raise
    
    def export_audio(self, audio_path: str, format: str = "wav", 
                    quality: str = "high") -> str:
        """
        Export audio file to different format
        
        Args:
            audio_path: Path to audio file
            format: Output format
            quality: Quality setting
            
        Returns:
            Path to exported file
        """
        if not self.components_available:
            raise RuntimeError("AudioChat components not available")
        
        try:
            # Load audio file
            import librosa
            import uuid
            
            logger.info(f"Exporting audio file: {audio_path}")
            logger.info(f"Format: {format}, Quality: {quality}")
            
            # Generate a unique ID for the file
            file_id = str(uuid.uuid4())
            
            # Load the audio file
            y, sr = librosa.load(audio_path, sr=None)
            
            # Export the audio
            export_result = audio_exporter.export_audio(
                y, sr, file_id, format, quality
            )
            
            return export_result["path"]
            
        except Exception as e:
            logger.error(f"Error exporting audio: {str(e)}")
            raise
    
    def separate_sources(self, audio_path: str, mode: str = "2stems") -> Dict[str, str]:
        """
        Separate audio sources
        
        Args:
            audio_path: Path to audio file
            mode: Separation mode ('2stems', '4stems', or '5stems')
            
        Returns:
            Dictionary of source names to output paths
        """
        if not self.components_available or not advanced_effects.spleeter_available:
            raise RuntimeError("Source separation not available")
        
        try:
            # Load audio file
            import librosa
            import soundfile as sf
            import uuid
            
            logger.info(f"Separating audio sources: {audio_path}")
            logger.info(f"Mode: {mode}")
            
            # Load the audio file
            y, sr = librosa.load(audio_path, sr=None)
            
            # Separate sources
            sources = advanced_effects.separate_sources(y, sr, mode)
            
            # Save each source
            result = {}
            for source_name, source_data in sources.items():
                if source_name == "original":
                    continue
                    
                # Generate a unique ID for this source
                source_id = f"{uuid.uuid4()}"
                source_path = str(self.processed_dir / f"{source_id}.wav")
                
                # Save the source
                sf.write(source_path, source_data, sr)
                
                # Add to result
                result[source_name] = source_path
            
            return result
            
        except Exception as e:
            logger.error(f"Error separating sources: {str(e)}")
            raise
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        # Update status
        self.status = self._check_system_status()
        
        # Add version information
        import platform
        import sys
        
        self.status["system"] = {
            "platform": platform.platform(),
            "python_version": sys.version,
            "cpu_count": os.cpu_count()
        }
        
        # Add component versions
        try:
            import librosa
            import numpy
            self.status["versions"] = {
                "librosa": librosa.__version__,
                "numpy": numpy.__version__
            }
            
            if advanced_effects.pedalboard_available:
                import pedalboard
                self.status["versions"]["pedalboard"] = pedalboard.__version__
                
            if advanced_effects.spleeter_available:
                import spleeter
                self.status["versions"]["spleeter"] = spleeter.__version__
        except:
            pass
        
        return self.status

# Create singleton instance
audio_chat_system = AudioChatSystem()