"""
Cache Manager for Audio Processing

This module provides caching functionality to improve performance
by storing processed audio and analysis results.
"""

import os
import json
import hashlib
import time
import logging
import numpy as np
from pathlib import Path
import soundfile as sf
from typing import Dict, Any, Optional, Tuple, Union

logger = logging.getLogger(__name__)

class CacheManager:
    """Cache manager for audio processing results"""
    
    def __init__(self, cache_dir: Path):
        """
        Initialize the cache manager
        
        Args:
            cache_dir: Directory to store cache files
        """
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.audio_cache_dir = cache_dir / "audio"
        self.analysis_cache_dir = cache_dir / "analysis"
        self.waveform_cache_dir = cache_dir / "waveform"
        
        self.audio_cache_dir.mkdir(exist_ok=True)
        self.analysis_cache_dir.mkdir(exist_ok=True)
        self.waveform_cache_dir.mkdir(exist_ok=True)
        
        # Cache stats
        self.hits = 0
        self.misses = 0
        
        # Load cache index
        self.cache_index = self._load_cache_index()
        
        # Clean old cache entries
        self._clean_old_cache()
    
    def _load_cache_index(self) -> Dict[str, Any]:
        """Load cache index from disk"""
        index_path = self.cache_dir / "cache_index.json"
        if index_path.exists():
            try:
                with open(index_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading cache index: {str(e)}")
                return {"audio": {}, "analysis": {}, "waveform": {}}
        else:
            return {"audio": {}, "analysis": {}, "waveform": {}}
    
    def _save_cache_index(self):
        """Save cache index to disk"""
        index_path = self.cache_dir / "cache_index.json"
        try:
            with open(index_path, 'w') as f:
                json.dump(self.cache_index, f)
        except Exception as e:
            logger.error(f"Error saving cache index: {str(e)}")
    
    def _clean_old_cache(self, max_age_days: int = 7):
        """Clean old cache entries"""
        now = time.time()
        max_age = max_age_days * 24 * 60 * 60  # Convert days to seconds
        
        # Clean audio cache
        for key, entry in list(self.cache_index["audio"].items()):
            if now - entry["timestamp"] > max_age:
                try:
                    cache_path = self.audio_cache_dir / entry["filename"]
                    if cache_path.exists():
                        os.remove(cache_path)
                    del self.cache_index["audio"][key]
                except Exception as e:
                    logger.error(f"Error cleaning audio cache: {str(e)}")
        
        # Clean analysis cache
        for key, entry in list(self.cache_index["analysis"].items()):
            if now - entry["timestamp"] > max_age:
                try:
                    cache_path = self.analysis_cache_dir / entry["filename"]
                    if cache_path.exists():
                        os.remove(cache_path)
                    del self.cache_index["analysis"][key]
                except Exception as e:
                    logger.error(f"Error cleaning analysis cache: {str(e)}")
        
        # Clean waveform cache
        for key, entry in list(self.cache_index["waveform"].items()):
            if now - entry["timestamp"] > max_age:
                try:
                    cache_path = self.waveform_cache_dir / entry["filename"]
                    if cache_path.exists():
                        os.remove(cache_path)
                    del self.cache_index["waveform"][key]
                except Exception as e:
                    logger.error(f"Error cleaning waveform cache: {str(e)}")
        
        # Save updated index
        self._save_cache_index()
    
    def _generate_cache_key(self, data: Dict[str, Any]) -> str:
        """Generate a cache key from data"""
        # Convert data to a stable string representation
        data_str = json.dumps(data, sort_keys=True)
        # Generate hash
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def get_processed_audio(self, file_id: str, instructions: str, 
                           effects: Optional[list] = None, 
                           segment: Optional[Dict[str, float]] = None) -> Optional[Tuple[np.ndarray, int]]:
        """
        Get processed audio from cache
        
        Args:
            file_id: Original file ID
            instructions: Processing instructions
            effects: List of effects to apply
            segment: Audio segment to process
            
        Returns:
            Tuple of (audio_data, sample_rate) if cache hit, None otherwise
        """
        # Generate cache key
        cache_data = {
            "file_id": file_id,
            "instructions": instructions,
            "effects": effects,
            "segment": segment
        }
        cache_key = self._generate_cache_key(cache_data)
        
        # Check if in cache
        if cache_key in self.cache_index["audio"]:
            try:
                cache_entry = self.cache_index["audio"][cache_key]
                cache_path = self.audio_cache_dir / cache_entry["filename"]
                
                if cache_path.exists():
                    # Load audio from cache
                    audio_data, sample_rate = sf.read(cache_path)
                    self.hits += 1
                    logger.info(f"Cache hit for processed audio: {cache_key}")
                    return audio_data, sample_rate
            except Exception as e:
                logger.error(f"Error loading cached audio: {str(e)}")
        
        self.misses += 1
        logger.info(f"Cache miss for processed audio: {cache_key}")
        return None
    
    def cache_processed_audio(self, file_id: str, instructions: str, 
                             audio_data: np.ndarray, sample_rate: int,
                             effects: Optional[list] = None,
                             segment: Optional[Dict[str, float]] = None):
        """
        Cache processed audio
        
        Args:
            file_id: Original file ID
            instructions: Processing instructions
            audio_data: Processed audio data
            sample_rate: Sample rate
            effects: List of effects applied
            segment: Audio segment processed
        """
        # Generate cache key
        cache_data = {
            "file_id": file_id,
            "instructions": instructions,
            "effects": effects,
            "segment": segment
        }
        cache_key = self._generate_cache_key(cache_data)
        
        try:
            # Generate filename
            cache_filename = f"{cache_key}.wav"
            cache_path = self.audio_cache_dir / cache_filename
            
            # Save audio to cache
            sf.write(cache_path, audio_data, sample_rate)
            
            # Update cache index
            self.cache_index["audio"][cache_key] = {
                "filename": cache_filename,
                "timestamp": time.time(),
                "file_id": file_id,
                "instructions": instructions,
                "effects": effects,
                "segment": segment
            }
            
            # Save cache index
            self._save_cache_index()
            
            logger.info(f"Cached processed audio: {cache_key}")
        except Exception as e:
            logger.error(f"Error caching processed audio: {str(e)}")
    
    def get_audio_analysis(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        Get audio analysis from cache
        
        Args:
            file_id: File ID
            
        Returns:
            Analysis data if cache hit, None otherwise
        """
        # Generate cache key
        cache_key = f"analysis_{file_id}"
        
        # Check if in cache
        if cache_key in self.cache_index["analysis"]:
            try:
                cache_entry = self.cache_index["analysis"][cache_key]
                cache_path = self.analysis_cache_dir / cache_entry["filename"]
                
                if cache_path.exists():
                    # Load analysis from cache
                    with open(cache_path, 'r') as f:
                        analysis_data = json.load(f)
                    
                    self.hits += 1
                    logger.info(f"Cache hit for audio analysis: {cache_key}")
                    return analysis_data
            except Exception as e:
                logger.error(f"Error loading cached analysis: {str(e)}")
        
        self.misses += 1
        logger.info(f"Cache miss for audio analysis: {cache_key}")
        return None
    
    def cache_audio_analysis(self, file_id: str, analysis_data: Dict[str, Any]):
        """
        Cache audio analysis
        
        Args:
            file_id: File ID
            analysis_data: Analysis data to cache
        """
        # Generate cache key
        cache_key = f"analysis_{file_id}"
        
        try:
            # Generate filename
            cache_filename = f"{cache_key}.json"
            cache_path = self.analysis_cache_dir / cache_filename
            
            # Save analysis to cache
            with open(cache_path, 'w') as f:
                json.dump(analysis_data, f)
            
            # Update cache index
            self.cache_index["analysis"][cache_key] = {
                "filename": cache_filename,
                "timestamp": time.time(),
                "file_id": file_id
            }
            
            # Save cache index
            self._save_cache_index()
            
            logger.info(f"Cached audio analysis: {cache_key}")
        except Exception as e:
            logger.error(f"Error caching audio analysis: {str(e)}")
    
    def get_waveform_data(self, file_id: str, points: int = 1000) -> Optional[Dict[str, Any]]:
        """
        Get waveform data from cache
        
        Args:
            file_id: File ID
            points: Number of points in waveform
            
        Returns:
            Waveform data if cache hit, None otherwise
        """
        # Generate cache key
        cache_key = f"waveform_{file_id}_{points}"
        
        # Check if in cache
        if cache_key in self.cache_index["waveform"]:
            try:
                cache_entry = self.cache_index["waveform"][cache_key]
                cache_path = self.waveform_cache_dir / cache_entry["filename"]
                
                if cache_path.exists():
                    # Load waveform from cache
                    with open(cache_path, 'r') as f:
                        waveform_data = json.load(f)
                    
                    self.hits += 1
                    logger.info(f"Cache hit for waveform data: {cache_key}")
                    return waveform_data
            except Exception as e:
                logger.error(f"Error loading cached waveform: {str(e)}")
        
        self.misses += 1
        logger.info(f"Cache miss for waveform data: {cache_key}")
        return None
    
    def cache_waveform_data(self, file_id: str, waveform_data: Dict[str, Any], points: int = 1000):
        """
        Cache waveform data
        
        Args:
            file_id: File ID
            waveform_data: Waveform data to cache
            points: Number of points in waveform
        """
        # Generate cache key
        cache_key = f"waveform_{file_id}_{points}"
        
        try:
            # Generate filename
            cache_filename = f"{cache_key}.json"
            cache_path = self.waveform_cache_dir / cache_filename
            
            # Save waveform to cache
            with open(cache_path, 'w') as f:
                json.dump(waveform_data, f)
            
            # Update cache index
            self.cache_index["waveform"][cache_key] = {
                "filename": cache_filename,
                "timestamp": time.time(),
                "file_id": file_id,
                "points": points
            }
            
            # Save cache index
            self._save_cache_index()
            
            logger.info(f"Cached waveform data: {cache_key}")
        except Exception as e:
            logger.error(f"Error caching waveform data: {str(e)}")
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio": self.hits / (self.hits + self.misses) if (self.hits + self.misses) > 0 else 0,
            "audio_entries": len(self.cache_index["audio"]),
            "analysis_entries": len(self.cache_index["analysis"]),
            "waveform_entries": len(self.cache_index["waveform"])
        }
    
    def clear_cache(self):
        """Clear all cache entries"""
        try:
            # Clear audio cache
            for entry in self.cache_index["audio"].values():
                cache_path = self.audio_cache_dir / entry["filename"]
                if cache_path.exists():
                    os.remove(cache_path)
            
            # Clear analysis cache
            for entry in self.cache_index["analysis"].values():
                cache_path = self.analysis_cache_dir / entry["filename"]
                if cache_path.exists():
                    os.remove(cache_path)
            
            # Clear waveform cache
            for entry in self.cache_index["waveform"].values():
                cache_path = self.waveform_cache_dir / entry["filename"]
                if cache_path.exists():
                    os.remove(cache_path)
            
            # Reset cache index
            self.cache_index = {"audio": {}, "analysis": {}, "waveform": {}}
            self._save_cache_index()
            
            logger.info("Cache cleared")
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")

# Create singleton instance
cache_manager = CacheManager(Path("cache"))