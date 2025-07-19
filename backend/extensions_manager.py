"""
Extensions Manager for AudioChat

This module manages the available extensions and their activation status.
Extensions provide additional audio processing capabilities beyond the core features.
"""

import os
import json
import logging
import importlib
import importlib.util
from pathlib import Path
from typing import Dict, List, Any, Optional, Set

logger = logging.getLogger(__name__)

class Extension:
    """Represents an AudioChat extension with additional capabilities"""
    
    def __init__(self, id: str, name: str, description: str, version: str,
                 category: str, premium: bool = False, dependencies: List[str] = None,
                 module_path: Optional[str] = None):
        """
        Initialize an extension
        
        Args:
            id: Unique identifier for the extension
            name: Display name of the extension
            description: Description of the extension's capabilities
            version: Version string
            category: Category of the extension (e.g., 'audio_processing', 'analysis')
            premium: Whether this is a premium extension
            dependencies: List of Python package dependencies
            module_path: Path to the Python module implementing the extension
        """
        self.id = id
        self.name = name
        self.description = description
        self.version = version
        self.category = category
        self.premium = premium
        self.dependencies = dependencies or []
        self.module_path = module_path
        self.enabled = False
        self.loaded = False
        self.module = None
        self.capabilities = []
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert extension to dictionary for API responses"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "category": self.category,
            "premium": self.premium,
            "dependencies": self.dependencies,
            "enabled": self.enabled,
            "loaded": self.loaded,
            "capabilities": self.capabilities,
            "error": self.error
        }
    
    def __repr__(self) -> str:
        return f"Extension({self.id}, {self.name}, enabled={self.enabled}, premium={self.premium})"


class ExtensionsManager:
    """Manager for AudioChat extensions"""
    
    def __init__(self, extensions_dir: Path):
        """
        Initialize the extensions manager
        
        Args:
            extensions_dir: Directory containing extension modules
        """
        self.extensions_dir = extensions_dir
        self.extensions_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.config_dir = extensions_dir / "config"
        self.modules_dir = extensions_dir / "modules"
        
        self.config_dir.mkdir(exist_ok=True)
        self.modules_dir.mkdir(exist_ok=True)
        
        # Load extensions
        self.extensions: Dict[str, Extension] = {}
        self.load_extensions()
        
        # Load user activation status
        self.user_extensions: Dict[str, Set[str]] = {}
        self.load_user_extensions()
        
        logger.info(f"Extensions manager initialized with {len(self.extensions)} extensions")
    
    def load_extensions(self):
        """Load all available extensions from the extensions directory"""
        # Load built-in extensions
        self._load_builtin_extensions()
        
        # Load extensions from config files
        config_files = list(self.config_dir.glob("*.json"))
        for config_file in config_files:
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                
                extension_id = config.get("id")
                if not extension_id:
                    logger.warning(f"Extension config {config_file} missing id, skipping")
                    continue
                
                # Create extension object
                extension = Extension(
                    id=extension_id,
                    name=config.get("name", extension_id),
                    description=config.get("description", ""),
                    version=config.get("version", "1.0.0"),
                    category=config.get("category", "other"),
                    premium=config.get("premium", False),
                    dependencies=config.get("dependencies", []),
                    module_path=config.get("module_path")
                )
                
                # Add to extensions dict
                self.extensions[extension_id] = extension
                
                logger.info(f"Loaded extension config: {extension_id}")
            except Exception as e:
                logger.error(f"Error loading extension config {config_file}: {str(e)}")
    
    def _load_builtin_extensions(self):
        """Load built-in extensions"""
        # Essentia extension for advanced music analysis
        self.extensions["essentia"] = Extension(
            id="essentia",
            name="Advanced Music Analysis",
            description="Advanced music analysis capabilities including beat detection, key recognition, chord detection, and more",
            version="1.0.0",
            category="analysis",
            premium=True,
            dependencies=["essentia"],
            module_path="extensions.essentia_extension"
        )
        
        # Hugging Face Transformers extension for AI-powered audio processing
        self.extensions["transformers"] = Extension(
            id="transformers",
            name="AI Audio Processing",
            description="AI-powered audio processing including speech recognition, audio captioning, and more",
            version="1.0.0",
            category="ai",
            premium=True,
            dependencies=["transformers", "torch"],
            module_path="extensions.transformers_extension"
        )
        
        # Spleeter extension for advanced source separation
        self.extensions["spleeter"] = Extension(
            id="spleeter",
            name="Advanced Source Separation",
            description="Advanced source separation capabilities including vocal removal, stem separation, and more",
            version="1.0.0",
            category="processing",
            premium=True,
            dependencies=["spleeter"],
            module_path="extensions.spleeter_extension"
        )
        
        # Pedalboard extension for professional audio effects
        self.extensions["pedalboard"] = Extension(
            id="pedalboard",
            name="Professional Audio Effects",
            description="Professional-grade audio effects including compressors, EQs, reverbs, and more",
            version="1.0.0",
            category="effects",
            premium=False,  # Basic version is free
            dependencies=["pedalboard"],
            module_path="extensions.pedalboard_extension"
        )
        
        # Madmom extension for rhythm analysis
        self.extensions["madmom"] = Extension(
            id="madmom",
            name="Rhythm Analysis",
            description="Advanced rhythm analysis capabilities including beat tracking, downbeat detection, and more",
            version="1.0.0",
            category="analysis",
            premium=True,
            dependencies=["madmom"],
            module_path="extensions.madmom_extension"
        )
    
    def load_user_extensions(self):
        """Load user extension activation status"""
        user_config_path = self.extensions_dir / "user_extensions.json"
        if user_config_path.exists():
            try:
                with open(user_config_path, 'r') as f:
                    self.user_extensions = json.load(f)
                
                # Convert lists to sets for faster lookup
                for user_id, extensions in self.user_extensions.items():
                    self.user_extensions[user_id] = set(extensions)
                
                logger.info(f"Loaded user extensions for {len(self.user_extensions)} users")
            except Exception as e:
                logger.error(f"Error loading user extensions: {str(e)}")
                self.user_extensions = {}
    
    def save_user_extensions(self):
        """Save user extension activation status"""
        user_config_path = self.extensions_dir / "user_extensions.json"
        try:
            # Convert sets to lists for JSON serialization
            serializable = {user_id: list(extensions) for user_id, extensions in self.user_extensions.items()}
            
            with open(user_config_path, 'w') as f:
                json.dump(serializable, f, indent=2)
            
            logger.info(f"Saved user extensions for {len(self.user_extensions)} users")
        except Exception as e:
            logger.error(f"Error saving user extensions: {str(e)}")
    
    def get_extensions(self) -> List[Dict[str, Any]]:
        """Get all available extensions"""
        return [ext.to_dict() for ext in self.extensions.values()]
    
    def get_extension(self, extension_id: str) -> Optional[Extension]:
        """Get a specific extension by ID"""
        return self.extensions.get(extension_id)
    
    def get_user_extensions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get extensions available to a specific user"""
        user_extension_ids = self.user_extensions.get(user_id, set())
        
        result = []
        for ext in self.extensions.values():
            # Include all non-premium extensions and premium extensions the user has access to
            if not ext.premium or ext.id in user_extension_ids:
                ext_dict = ext.to_dict()
                ext_dict["enabled"] = ext.id in user_extension_ids
                result.append(ext_dict)
        
        return result
    
    def enable_extension(self, user_id: str, extension_id: str) -> bool:
        """
        Enable an extension for a user
        
        Args:
            user_id: User ID
            extension_id: Extension ID
            
        Returns:
            True if successful, False otherwise
        """
        extension = self.extensions.get(extension_id)
        if not extension:
            logger.warning(f"Extension {extension_id} not found")
            return False
        
        # Check if premium and user has access
        if extension.premium:
            # In a real implementation, check if user has purchased this extension
            # For now, we'll allow it for development purposes
            pass
        
        # Add to user's extensions
        if user_id not in self.user_extensions:
            self.user_extensions[user_id] = set()
        
        self.user_extensions[user_id].add(extension_id)
        self.save_user_extensions()
        
        logger.info(f"Enabled extension {extension_id} for user {user_id}")
        return True
    
    def disable_extension(self, user_id: str, extension_id: str) -> bool:
        """
        Disable an extension for a user
        
        Args:
            user_id: User ID
            extension_id: Extension ID
            
        Returns:
            True if successful, False otherwise
        """
        if user_id not in self.user_extensions:
            return False
        
        if extension_id in self.user_extensions[user_id]:
            self.user_extensions[user_id].remove(extension_id)
            self.save_user_extensions()
            logger.info(f"Disabled extension {extension_id} for user {user_id}")
            return True
        
        return False
    
    def load_extension_module(self, extension_id: str) -> bool:
        """
        Load the Python module for an extension
        
        Args:
            extension_id: Extension ID
            
        Returns:
            True if successful, False otherwise
        """
        extension = self.extensions.get(extension_id)
        if not extension or not extension.module_path:
            return False
        
        if extension.loaded:
            return True
        
        try:
            # Check if dependencies are installed
            for dependency in extension.dependencies:
                try:
                    importlib.import_module(dependency)
                except ImportError:
                    extension.error = f"Missing dependency: {dependency}"
                    logger.warning(f"Extension {extension_id} missing dependency: {dependency}")
                    return False
            
            # Load the module
            module_name = extension.module_path
            extension.module = importlib.import_module(module_name)
            extension.loaded = True
            
            # Get capabilities from module
            if hasattr(extension.module, 'CAPABILITIES'):
                extension.capabilities = extension.module.CAPABILITIES
            
            logger.info(f"Loaded extension module: {extension_id}")
            return True
        except Exception as e:
            extension.error = str(e)
            logger.error(f"Error loading extension module {extension_id}: {str(e)}")
            return False
    
    def is_extension_enabled(self, user_id: str, extension_id: str) -> bool:
        """Check if an extension is enabled for a user"""
        if user_id not in self.user_extensions:
            return False
        
        extension = self.extensions.get(extension_id)
        if not extension:
            return False
        
        # Non-premium extensions are always available
        if not extension.premium:
            return True
        
        # Premium extensions need to be in the user's enabled list
        return extension_id in self.user_extensions[user_id]
    
    def get_extension_module(self, user_id: str, extension_id: str):
        """
        Get the loaded module for an extension if it's enabled for the user
        
        Args:
            user_id: User ID
            extension_id: Extension ID
            
        Returns:
            The extension module if enabled and loaded, None otherwise
        """
        if not self.is_extension_enabled(user_id, extension_id):
            return None
        
        extension = self.extensions.get(extension_id)
        if not extension:
            return None
        
        if not extension.loaded:
            self.load_extension_module(extension_id)
        
        return extension.module if extension.loaded else None

# Create singleton instance
extensions_manager = ExtensionsManager(Path("extensions"))