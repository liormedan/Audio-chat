"""
Parallel Audio Processing Module

This module provides functionality for processing large audio files
in parallel using multiprocessing.
"""

import os
import numpy as np
import logging
import time
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, Any, List, Tuple, Callable, Optional
from functools import partial

logger = logging.getLogger(__name__)

class ParallelProcessor:
    """Parallel processor for large audio files"""
    
    def __init__(self, max_workers: Optional[int] = None):
        """
        Initialize the parallel processor
        
        Args:
            max_workers: Maximum number of worker processes (default: CPU count)
        """
        self.max_workers = max_workers or multiprocessing.cpu_count()
        logger.info(f"Initialized parallel processor with {self.max_workers} workers")
    
    def process_audio_parallel(self, audio_data: np.ndarray, sample_rate: int,
                              process_func: Callable, chunk_duration_seconds: float = 10.0,
                              overlap_seconds: float = 0.5, **kwargs) -> np.ndarray:
        """
        Process audio in parallel by splitting it into chunks
        
        Args:
            audio_data: Audio data as numpy array
            sample_rate: Sample rate in Hz
            process_func: Function to apply to each chunk (must accept audio_data, sample_rate, **kwargs)
            chunk_duration_seconds: Duration of each chunk in seconds
            overlap_seconds: Overlap between chunks in seconds
            **kwargs: Additional arguments to pass to process_func
            
        Returns:
            Processed audio data
        """
        start_time = time.time()
        
        # Calculate chunk size and overlap in samples
        chunk_size = int(chunk_duration_seconds * sample_rate)
        overlap_size = int(overlap_seconds * sample_rate)
        
        # Handle case where audio is shorter than chunk size
        if len(audio_data) <= chunk_size:
            logger.info("Audio shorter than chunk size, processing as single chunk")
            return process_func(audio_data, sample_rate, **kwargs)
        
        # Split audio into overlapping chunks
        chunks = []
        positions = []
        
        for start_pos in range(0, len(audio_data), chunk_size - overlap_size):
            end_pos = min(start_pos + chunk_size, len(audio_data))
            chunk = audio_data[start_pos:end_pos]
            chunks.append(chunk)
            positions.append((start_pos, end_pos))
            
            # If we've reached the end of the audio, break
            if end_pos == len(audio_data):
                break
        
        logger.info(f"Split audio into {len(chunks)} chunks for parallel processing")
        
        # Process chunks in parallel
        processed_chunks = []
        
        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            # Create a partial function with the fixed arguments
            chunk_processor = partial(process_func, sample_rate=sample_rate, **kwargs)
            
            # Submit all chunks for processing
            future_to_chunk = {executor.submit(chunk_processor, chunk): i for i, chunk in enumerate(chunks)}
            
            # Collect results as they complete
            for future in as_completed(future_to_chunk):
                chunk_idx = future_to_chunk[future]
                try:
                    processed_chunk = future.result()
                    processed_chunks.append((chunk_idx, processed_chunk))
                    logger.debug(f"Processed chunk {chunk_idx+1}/{len(chunks)}")
                except Exception as e:
                    logger.error(f"Error processing chunk {chunk_idx}: {str(e)}")
                    # Use original chunk as fallback
                    processed_chunks.append((chunk_idx, chunks[chunk_idx]))
        
        # Sort chunks by their original index
        processed_chunks.sort(key=lambda x: x[0])
        processed_chunks = [chunk for _, chunk in processed_chunks]
        
        # Merge chunks with crossfade in overlap regions
        merged_audio = self._merge_chunks_with_crossfade(processed_chunks, positions, overlap_size)
        
        elapsed_time = time.time() - start_time
        logger.info(f"Parallel processing completed in {elapsed_time:.2f} seconds")
        
        return merged_audio
    
    def _merge_chunks_with_crossfade(self, chunks: List[np.ndarray], 
                                    positions: List[Tuple[int, int]],
                                    overlap_size: int) -> np.ndarray:
        """
        Merge processed chunks with crossfade in overlap regions
        
        Args:
            chunks: List of processed audio chunks
            positions: List of (start, end) positions for each chunk
            overlap_size: Size of overlap region in samples
            
        Returns:
            Merged audio data
        """
        # Create output array with same length as original audio
        output_length = positions[-1][1]
        output = np.zeros(output_length, dtype=chunks[0].dtype)
        
        # For first chunk, no crossfade needed at the beginning
        start_pos, end_pos = positions[0]
        output[start_pos:end_pos] = chunks[0]
        
        # For remaining chunks, apply crossfade in overlap regions
        for i in range(1, len(chunks)):
            start_pos, end_pos = positions[i]
            prev_end = positions[i-1][1]
            
            # Calculate overlap region
            overlap_start = start_pos
            overlap_end = min(prev_end, end_pos)
            overlap_length = overlap_end - overlap_start
            
            if overlap_length > 0:
                # Create crossfade weights
                fade_in = np.linspace(0, 1, overlap_length)
                fade_out = np.linspace(1, 0, overlap_length)
                
                # Apply crossfade in overlap region
                output[overlap_start:overlap_end] = (
                    output[overlap_start:overlap_end] * fade_out +
                    chunks[i][:overlap_length] * fade_in
                )
                
                # Copy non-overlapping part
                output[overlap_end:end_pos] = chunks[i][overlap_length:]
            else:
                # No overlap, just copy the chunk
                output[start_pos:end_pos] = chunks[i]
        
        return output
    
    def process_audio_with_effects_parallel(self, audio_data: np.ndarray, sample_rate: int,
                                          effects_chain: List[Dict[str, Any]],
                                          chunk_duration_seconds: float = 10.0,
                                          overlap_seconds: float = 0.5) -> np.ndarray:
        """
        Process audio with a chain of effects in parallel
        
        Args:
            audio_data: Audio data as numpy array
            sample_rate: Sample rate in Hz
            effects_chain: List of effect configurations
            chunk_duration_seconds: Duration of each chunk in seconds
            overlap_seconds: Overlap between chunks in seconds
            
        Returns:
            Processed audio data
        """
        from audio_processing import audio_processor
        
        # Define a function to apply the effects chain to a chunk
        def apply_effects_to_chunk(chunk, sample_rate, effects):
            # Process the chunk with the effects chain
            processed_chunk, _ = audio_processor.apply_effects_chain(chunk, sample_rate, effects)
            return processed_chunk
        
        # Process in parallel
        return self.process_audio_parallel(
            audio_data, 
            sample_rate, 
            apply_effects_to_chunk, 
            chunk_duration_seconds, 
            overlap_seconds,
            effects=effects_chain
        )

# Create singleton instance
parallel_processor = ParallelProcessor()