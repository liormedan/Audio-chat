"""
Integration Tests for AudioChat System

This module contains tests for the integrated AudioChat system,
ensuring all components work together correctly.
"""

import os
import sys
import unittest
import tempfile
import shutil
import numpy as np
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import components to test
try:
    from integration import audio_chat_system
    from audio_processing import audio_processor
    from advanced_audio_effects import advanced_effects
    from cache_manager import cache_manager
    from parallel_processor import parallel_processor
    from llm_processor import llm_processor
    
    COMPONENTS_AVAILABLE = True
except ImportError as e:
    print(f"Error importing components: {str(e)}")
    COMPONENTS_AVAILABLE = False

@unittest.skipIf(not COMPONENTS_AVAILABLE, "AudioChat components not available")
class TestAudioChatIntegration(unittest.TestCase):
    """Test the integrated AudioChat system"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        # Create test directories
        cls.test_dir = Path(tempfile.mkdtemp())
        cls.test_cache_dir = cls.test_dir / "cache"
        cls.test_upload_dir = cls.test_dir / "uploads"
        cls.test_processed_dir = cls.test_dir / "processed"
        
        cls.test_cache_dir.mkdir(exist_ok=True)
        cls.test_upload_dir.mkdir(exist_ok=True)
        cls.test_processed_dir.mkdir(exist_ok=True)
        
        # Create test audio file
        cls.test_audio_path = cls.test_dir / "test_audio.wav"
        cls._create_test_audio_file(cls.test_audio_path)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test environment"""
        shutil.rmtree(cls.test_dir)
    
    @classmethod
    def _create_test_audio_file(cls, path):
        """Create a test audio file"""
        import soundfile as sf
        
        # Create a simple sine wave
        sample_rate = 44100
        duration = 5  # seconds
        frequency = 440  # Hz
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Save to file
        sf.write(path, audio_data, sample_rate)
    
    def test_system_initialization(self):
        """Test system initialization"""
        self.assertTrue(audio_chat_system.components_available)
        self.assertTrue(audio_chat_system.status["components_available"])
        self.assertTrue(audio_chat_system.status["cache_available"])
        self.assertTrue(audio_chat_system.status["directories"]["cache"])
        self.assertTrue(audio_chat_system.status["directories"]["uploads"])
        self.assertTrue(audio_chat_system.status["directories"]["processed"])
    
    def test_audio_processing(self):
        """Test audio processing"""
        # Process audio with simple instructions
        output_path, processing_steps = audio_chat_system.process_audio(
            str(self.test_audio_path),
            "Add some reverb and make it louder",
            use_cache=False
        )
        
        # Check output
        self.assertTrue(os.path.exists(output_path))
        self.assertGreater(len(processing_steps), 0)
        
        # Check file size
        self.assertGreater(os.path.getsize(output_path), 0)
    
    def test_audio_processing_with_cache(self):
        """Test audio processing with cache"""
        # Process audio with cache
        output_path1, steps1 = audio_chat_system.process_audio(
            str(self.test_audio_path),
            "Add some compression",
            use_cache=True
        )
        
        # Process again with same instructions
        output_path2, steps2 = audio_chat_system.process_audio(
            str(self.test_audio_path),
            "Add some compression",
            use_cache=True
        )
        
        # Check that both outputs exist
        self.assertTrue(os.path.exists(output_path1))
        self.assertTrue(os.path.exists(output_path2))
        
        # Check cache stats
        self.assertGreater(cache_manager.hits, 0)
    
    def test_audio_processing_with_segment(self):
        """Test audio processing with segment"""
        # Process only a segment of the audio
        segment = {"start": 1.0, "end": 3.0}
        output_path, processing_steps = audio_chat_system.process_audio(
            str(self.test_audio_path),
            "Add some reverb",
            segment=segment,
            use_cache=False
        )
        
        # Check output
        self.assertTrue(os.path.exists(output_path))
        
        # Check that output file has same duration as input
        import soundfile as sf
        input_info = sf.info(str(self.test_audio_path))
        output_info = sf.info(output_path)
        
        self.assertAlmostEqual(input_info.duration, output_info.duration, places=1)
    
    @unittest.skipIf(not hasattr(advanced_effects, 'spleeter_available') or 
                    not advanced_effects.spleeter_available, 
                    "Spleeter not available")
    def test_source_separation(self):
        """Test source separation"""
        # Separate sources
        sources = audio_chat_system.separate_sources(
            str(self.test_audio_path),
            mode="2stems"
        )
        
        # Check that sources were created
        self.assertIn("vocals", sources)
        self.assertIn("accompaniment", sources)
        
        # Check that source files exist
        self.assertTrue(os.path.exists(sources["vocals"]))
        self.assertTrue(os.path.exists(sources["accompaniment"]))
    
    def test_export_audio(self):
        """Test audio export"""
        # Export audio to different formats
        formats = ["wav", "mp3", "flac"]
        
        for format in formats:
            try:
                output_path = audio_chat_system.export_audio(
                    str(self.test_audio_path),
                    format=format,
                    quality="high"
                )
                
                # Check that output file exists
                self.assertTrue(os.path.exists(output_path))
                self.assertTrue(output_path.endswith(format))
            except Exception as e:
                print(f"Export to {format} failed: {str(e)}")
    
    def test_parallel_processing(self):
        """Test parallel processing"""
        # Create a longer test file
        long_audio_path = self.test_dir / "long_test_audio.wav"
        
        import soundfile as sf
        
        # Create a longer sine wave (40 seconds)
        sample_rate = 44100
        duration = 40  # seconds
        frequency = 440  # Hz
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Save to file
        sf.write(long_audio_path, audio_data, sample_rate)
        
        # Process with parallel processing
        output_path, processing_steps = audio_chat_system.process_audio(
            str(long_audio_path),
            "Add some reverb and make it louder",
            use_cache=False
        )
        
        # Check output
        self.assertTrue(os.path.exists(output_path))
        self.assertGreater(len(processing_steps), 0)

@unittest.skipIf(not COMPONENTS_AVAILABLE, "AudioChat components not available")
class TestAudioProcessor(unittest.TestCase):
    """Test the audio processor component"""
    
    def test_analyze_audio(self):
        """Test audio analysis"""
        # Create test audio
        sample_rate = 44100
        duration = 2  # seconds
        frequency = 440  # Hz
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Analyze audio
        analysis = audio_processor.analyze_audio(audio_data, sample_rate)
        
        # Check analysis results
        self.assertIn("rms_level", analysis)
        self.assertIn("peak_level", analysis)
        self.assertIn("crest_factor", analysis)
        self.assertIn("spectral_centroid", analysis)
        
        # Check values
        self.assertGreater(analysis["peak_level"], 0)
        self.assertLess(analysis["peak_level"], 1)
        self.assertGreater(analysis["crest_factor"], 0)
    
    def test_parse_instructions(self):
        """Test instruction parsing"""
        # Parse simple instructions
        effects = audio_processor.parse_instructions(
            "Add some reverb and make it louder",
            {}
        )
        
        # Check effects
        self.assertGreater(len(effects), 0)
        
        # Check for specific effects
        effect_types = [effect["type"] for effect in effects]
        self.assertIn("reverb", effect_types)

@unittest.skipIf(not COMPONENTS_AVAILABLE or not hasattr(advanced_effects, 'pedalboard_available') or 
                not advanced_effects.pedalboard_available, 
                "Pedalboard not available")
class TestAdvancedEffects(unittest.TestCase):
    """Test the advanced effects component"""
    
    def test_process_with_pedalboard(self):
        """Test processing with Pedalboard"""
        # Create test audio
        sample_rate = 44100
        duration = 2  # seconds
        frequency = 440  # Hz
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Create effects chain
        effects_chain = [
            {
                "type": "reverb",
                "parameters": {
                    "room_size": 0.8,
                    "wet_level": 0.5
                }
            }
        ]
        
        # Process audio
        processed_audio = advanced_effects.process_with_pedalboard(
            audio_data,
            sample_rate,
            effects_chain
        )
        
        # Check output
        self.assertEqual(len(processed_audio), len(audio_data))
        
        # Check that output is different from input
        self.assertFalse(np.array_equal(processed_audio, audio_data))

@unittest.skipIf(not COMPONENTS_AVAILABLE, "AudioChat components not available")
class TestCacheManager(unittest.TestCase):
    """Test the cache manager component"""
    
    def setUp(self):
        """Set up test environment"""
        # Clear cache
        cache_manager.clear_cache()
    
    def test_cache_processed_audio(self):
        """Test caching processed audio"""
        # Create test audio
        sample_rate = 44100
        duration = 2  # seconds
        frequency = 440  # Hz
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Cache audio
        cache_manager.cache_processed_audio(
            "test_file_id",
            "Add some reverb",
            audio_data,
            sample_rate
        )
        
        # Retrieve from cache
        cached_audio = cache_manager.get_processed_audio(
            "test_file_id",
            "Add some reverb"
        )
        
        # Check that audio was retrieved
        self.assertIsNotNone(cached_audio)
        
        # Check that audio data matches
        cached_data, cached_sr = cached_audio
        self.assertEqual(cached_sr, sample_rate)
        self.assertTrue(np.array_equal(cached_data, audio_data))
    
    def test_cache_audio_analysis(self):
        """Test caching audio analysis"""
        # Create test analysis
        analysis = {
            "rms_level": 0.1,
            "peak_level": 0.5,
            "crest_factor": 5.0,
            "spectral_centroid": 1000
        }
        
        # Cache analysis
        cache_manager.cache_audio_analysis("test_file_id", analysis)
        
        # Retrieve from cache
        cached_analysis = cache_manager.get_audio_analysis("test_file_id")
        
        # Check that analysis was retrieved
        self.assertIsNotNone(cached_analysis)
        
        # Check that analysis matches
        self.assertEqual(cached_analysis["rms_level"], analysis["rms_level"])
        self.assertEqual(cached_analysis["peak_level"], analysis["peak_level"])
        self.assertEqual(cached_analysis["crest_factor"], analysis["crest_factor"])
        self.assertEqual(cached_analysis["spectral_centroid"], analysis["spectral_centroid"])

if __name__ == "__main__":
    unittest.main()