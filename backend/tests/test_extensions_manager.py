"""
Tests for the Extensions Manager module
"""

import unittest
import os
import sys
import json
import tempfile
import shutil
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions_manager import Extension, ExtensionsManager

class TestExtensionsManager(unittest.TestCase):
    """Test cases for the Extensions Manager"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a temporary directory for extensions
        self.temp_dir = tempfile.mkdtemp()
        self.extensions_dir = Path(self.temp_dir) / "extensions"
        self.extensions_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.config_dir = self.extensions_dir / "config"
        self.modules_dir = self.extensions_dir / "modules"
        
        self.config_dir.mkdir(exist_ok=True)
        self.modules_dir.mkdir(exist_ok=True)
        
        # Create a test extension config
        test_config = {
            "id": "test_extension",
            "name": "Test Extension",
            "description": "A test extension",
            "version": "1.0.0",
            "category": "test",
            "premium": False,
            "dependencies": [],
            "module_path": None
        }
        
        with open(self.config_dir / "test_extension.json", "w") as f:
            json.dump(test_config, f)
        
        # Create a test premium extension config
        premium_config = {
            "id": "premium_extension",
            "name": "Premium Extension",
            "description": "A premium test extension",
            "version": "1.0.0",
            "category": "test",
            "premium": True,
            "dependencies": [],
            "module_path": None
        }
        
        with open(self.config_dir / "premium_extension.json", "w") as f:
            json.dump(premium_config, f)
        
        # Initialize the extensions manager
        self.manager = ExtensionsManager(self.extensions_dir)
    
    def tearDown(self):
        """Clean up after tests"""
        shutil.rmtree(self.temp_dir)
    
    def test_load_extensions(self):
        """Test loading extensions from config files"""
        # Check if extensions were loaded
        self.assertIn("test_extension", self.manager.extensions)
        self.assertIn("premium_extension", self.manager.extensions)
        
        # Check extension properties
        test_ext = self.manager.extensions["test_extension"]
        self.assertEqual(test_ext.name, "Test Extension")
        self.assertEqual(test_ext.premium, False)
        
        premium_ext = self.manager.extensions["premium_extension"]
        self.assertEqual(premium_ext.name, "Premium Extension")
        self.assertEqual(premium_ext.premium, True)
    
    def test_get_extensions(self):
        """Test getting all extensions"""
        extensions = self.manager.get_extensions()
        self.assertEqual(len(extensions), 2)  # 2 extensions from config files
        
        # Check if extensions are returned as dictionaries
        self.assertIsInstance(extensions[0], dict)
        self.assertIn("id", extensions[0])
        self.assertIn("name", extensions[0])
        self.assertIn("premium", extensions[0])
    
    def test_get_user_extensions(self):
        """Test getting extensions for a specific user"""
        # Initially, user should see all non-premium extensions
        user_extensions = self.manager.get_user_extensions("test_user")
        self.assertEqual(len(user_extensions), 1)  # Only the non-premium extension
        
        # Enable premium extension for user
        self.manager.enable_extension("test_user", "premium_extension")
        
        # Now user should see both extensions
        user_extensions = self.manager.get_user_extensions("test_user")
        self.assertEqual(len(user_extensions), 2)
        
        # Check if premium extension is marked as enabled
        premium_ext = next((ext for ext in user_extensions if ext["id"] == "premium_extension"), None)
        self.assertIsNotNone(premium_ext)
        self.assertTrue(premium_ext["enabled"])
    
    def test_enable_disable_extension(self):
        """Test enabling and disabling extensions"""
        # Enable extension
        result = self.manager.enable_extension("test_user", "premium_extension")
        self.assertTrue(result)
        
        # Check if extension is enabled
        self.assertTrue(self.manager.is_extension_enabled("test_user", "premium_extension"))
        
        # Disable extension
        result = self.manager.disable_extension("test_user", "premium_extension")
        self.assertTrue(result)
        
        # Check if extension is disabled
        self.assertFalse(self.manager.is_extension_enabled("test_user", "premium_extension"))
    
    def test_nonexistent_extension(self):
        """Test operations with nonexistent extensions"""
        # Try to enable nonexistent extension
        result = self.manager.enable_extension("test_user", "nonexistent")
        self.assertFalse(result)
        
        # Try to disable nonexistent extension
        result = self.manager.disable_extension("test_user", "nonexistent")
        self.assertFalse(result)
        
        # Check if nonexistent extension is enabled
        self.assertFalse(self.manager.is_extension_enabled("test_user", "nonexistent"))
    
    def test_user_extensions_persistence(self):
        """Test if user extensions are saved and loaded correctly"""
        # Enable extension
        self.manager.enable_extension("test_user", "premium_extension")
        
        # Create a new manager instance to test loading
        new_manager = ExtensionsManager(self.extensions_dir)
        
        # Check if extension is still enabled
        self.assertTrue(new_manager.is_extension_enabled("test_user", "premium_extension"))
    
    def test_extension_to_dict(self):
        """Test converting extension to dictionary"""
        extension = self.manager.extensions["test_extension"]
        ext_dict = extension.to_dict()
        
        self.assertEqual(ext_dict["id"], "test_extension")
        self.assertEqual(ext_dict["name"], "Test Extension")
        self.assertEqual(ext_dict["premium"], False)
        self.assertEqual(ext_dict["enabled"], False)
        self.assertEqual(ext_dict["loaded"], False)

if __name__ == "__main__":
    unittest.main()