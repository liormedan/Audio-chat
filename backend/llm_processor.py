"""
LLM Processor for Audio Instructions

This module provides functionality for processing natural language instructions
for audio processing using Large Language Models (LLMs).
"""

import os
import json
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class LLMProcessor:
    """LLM processor for audio instructions"""
    
    def __init__(self):
        """Initialize the LLM processor"""
        # Check for API keys
        self.openai_api_key = os.environ.get("OPENAI_API_KEY")
        self.anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        self.google_api_key = os.environ.get("GOOGLE_API_KEY")
        
        # Determine available providers
        self.providers = []
        if self.openai_api_key:
            self.providers.append("openai")
        if self.anthropic_api_key:
            self.providers.append("anthropic")
        if self.google_api_key:
            self.providers.append("google")
            
        if not self.providers:
            logger.warning("No LLM API keys found. Using rule-based processing only.")
    
    def process_instructions(self, instructions: str, audio_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process natural language instructions using LLM
        
        Args:
            instructions: Natural language instructions from user
            audio_analysis: Analysis of the audio file
            
        Returns:
            List of effects to apply
        """
        # If no providers available, use rule-based processing
        if not self.providers:
            logger.info("Using rule-based processing for instructions")
            return self._rule_based_processing(instructions, audio_analysis)
        
        # Try to use LLM for processing
        try:
            # Choose provider (OpenAI preferred if available)
            provider = "openai" if "openai" in self.providers else self.providers[0]
            
            logger.info(f"Using {provider} for processing instructions")
            
            if provider == "openai":
                return self._process_with_openai(instructions, audio_analysis)
            elif provider == "anthropic":
                return self._process_with_anthropic(instructions, audio_analysis)
            elif provider == "google":
                return self._process_with_google(instructions, audio_analysis)
            else:
                return self._rule_based_processing(instructions, audio_analysis)
                
        except Exception as e:
            logger.error(f"Error processing with LLM: {str(e)}")
            logger.info("Falling back to rule-based processing")
            return self._rule_based_processing(instructions, audio_analysis)
    
    def _process_with_openai(self, instructions: str, audio_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process instructions using OpenAI API"""
        try:
            import openai
            
            # Set API key
            openai.api_key = self.openai_api_key
            
            # Prepare prompt
            prompt = self._create_prompt(instructions, audio_analysis)
            
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-4",  # Use GPT-4 for best results
                messages=[
                    {"role": "system", "content": "You are an expert audio engineer AI that converts natural language instructions into specific audio processing parameters."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,  # Low temperature for more deterministic results
                max_tokens=1000
            )
            
            # Extract and parse response
            result = response.choices[0].message.content
            return self._parse_llm_response(result)
            
        except Exception as e:
            logger.error(f"Error with OpenAI API: {str(e)}")
            raise
    
    def _process_with_anthropic(self, instructions: str, audio_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process instructions using Anthropic API"""
        try:
            # Prepare prompt
            prompt = self._create_prompt(instructions, audio_analysis)
            
            # Call Anthropic API
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.anthropic_api_key
            }
            
            data = {
                "prompt": f"\\n\\nHuman: {prompt}\\n\\nAssistant:",
                "model": "claude-2",
                "max_tokens_to_sample": 1000,
                "temperature": 0.2
            }
            
            response = requests.post(
                "https://api.anthropic.com/v1/complete",
                headers=headers,
                json=data
            )
            
            if response.status_code != 200:
                raise Exception(f"Anthropic API error: {response.text}")
                
            # Extract and parse response
            result = response.json().get("completion", "")
            return self._parse_llm_response(result)
            
        except Exception as e:
            logger.error(f"Error with Anthropic API: {str(e)}")
            raise
    
    def _process_with_google(self, instructions: str, audio_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process instructions using Google API"""
        try:
            # Prepare prompt
            prompt = self._create_prompt(instructions, audio_analysis)
            
            # Call Google API
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
            headers = {
                "Content-Type": "application/json"
            }
            
            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000
                }
            }
            
            response = requests.post(
                f"{url}?key={self.google_api_key}",
                headers=headers,
                json=data
            )
            
            if response.status_code != 200:
                raise Exception(f"Google API error: {response.text}")
                
            # Extract and parse response
            result = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return self._parse_llm_response(result)
            
        except Exception as e:
            logger.error(f"Error with Google API: {str(e)}")
            raise
    
    def _create_prompt(self, instructions: str, audio_analysis: Dict[str, Any]) -> str:
        """Create prompt for LLM"""
        prompt = f"""
I need to process an audio file based on the following instructions:

"{instructions}"

Here's the analysis of the audio file:
- Duration: {audio_analysis.get('duration', 'Unknown')} seconds
- Sample Rate: {audio_analysis.get('sample_rate', 'Unknown')} Hz
- Peak Level: {audio_analysis.get('peak_level', 'Unknown')}
- RMS Level: {audio_analysis.get('rms_level', 'Unknown')}
- Crest Factor: {audio_analysis.get('crest_factor', 'Unknown')}
- Spectral Centroid: {audio_analysis.get('spectral_centroid', 'Unknown')} Hz
- Estimated Key: {audio_analysis.get('estimated_key', 'Unknown')}
- Estimated Tempo: {audio_analysis.get('estimated_tempo', 'Unknown')} BPM
- Clipping: {audio_analysis.get('is_clipping', 'Unknown')}

Based on these instructions and audio analysis, provide a JSON array of audio effects to apply.
Each effect should be an object with "type" and "parameters" fields.

Available effect types:
- eq (parameters: low, low_mid, mid, high_mid, high - all in dB from -12 to +12)
- compression (parameters: threshold in dB, ratio, attack in ms, release in ms)
- reverb (parameters: room_size from 0 to 1, damping from 0 to 1, wet_level from 0 to 1, dry_level from 0 to 1)
- delay (parameters: time in seconds, feedback from 0 to 1, mix from 0 to 1)
- noise_reduction (parameters: strength from 0 to 1, sensitivity from 0 to 1)
- pitch_shift (parameters: semitones from -12 to +12)
- stereo_width (parameters: width from 0 to 2, where 0 is mono, 1 is normal, 2 is extra wide)
- distortion (parameters: drive from 1 to 10, mix from 0 to 1)
- filter (parameters: type ["lowpass", "highpass", "bandpass"], cutoff_low in Hz, cutoff_high in Hz, resonance from 0 to 1)
- gain (parameters: gain_db from -24 to +24)

Return ONLY the JSON array without any explanation or additional text.
Example:
[
  {
    "type": "eq",
    "parameters": {
      "low": 3,
      "high": -2
    }
  },
  {
    "type": "compression",
    "parameters": {
      "threshold": -20,
      "ratio": 4,
      "attack": 20,
      "release": 250
    }
  }
]
"""
        return prompt
    
    def _parse_llm_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse LLM response to extract effects chain"""
        try:
            # Extract JSON from response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON array found in response")
                
            json_str = response[json_start:json_end]
            effects_chain = json.loads(json_str)
            
            # Validate effects chain
            validated_chain = []
            for effect in effects_chain:
                if "type" not in effect or "parameters" not in effect:
                    continue
                    
                effect_type = effect["type"]
                parameters = effect["parameters"]
                
                # Add effect to validated chain
                validated_chain.append({
                    "type": effect_type,
                    "parameters": parameters
                })
            
            return validated_chain
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            logger.error(f"Response: {response}")
            raise ValueError("Failed to parse LLM response")
    
    def _rule_based_processing(self, instructions: str, audio_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process instructions using rule-based approach (fallback)
        
        This is a simplified version of the rule-based processing from audio_processor.py
        """
        instructions = instructions.lower()
        effects_chain = []
        
        # Check for EQ-related instructions
        if any(word in instructions for word in ["eq", "equalization", "equalizer", "bass", "treble", 
                                               "mid", "frequency", "frequencies", "tone"]):
            eq_params = {}
            
            # Check for bass adjustments
            if "bass" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["low"] = 4
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["low"] = -4
                else:
                    eq_params["low"] = 2
                    
            # Check for mid adjustments
            if "mid" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["mid"] = 3
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["mid"] = -3
                    
            # Check for treble adjustments
            if "treble" in instructions or "high" in instructions:
                if "more" in instructions or "boost" in instructions or "increase" in instructions:
                    eq_params["high"] = 3
                elif "less" in instructions or "cut" in instructions or "reduce" in instructions:
                    eq_params["high"] = -3
            
            # Add EQ to effects chain if parameters were set
            if eq_params:
                effects_chain.append({
                    "type": "eq",
                    "parameters": eq_params
                })
        
        # Check for compression-related instructions
        if any(word in instructions for word in ["compress", "compression", "dynamics", "punchy", "tight"]):
            comp_params = {
                "threshold": -20,
                "ratio": 3,
                "attack": 20,
                "release": 250
            }
            
            # Adjust parameters based on instructions
            if "heavy" in instructions or "strong" in instructions:
                comp_params["ratio"] = 6
                comp_params["threshold"] = -24
            elif "light" in instructions or "gentle" in instructions or "subtle" in instructions:
                comp_params["ratio"] = 2
                comp_params["threshold"] = -18
                
            effects_chain.append({
                "type": "compression",
                "parameters": comp_params
            })
        
        # Check for reverb-related instructions
        if any(word in instructions for word in ["reverb", "echo", "space", "room", "hall", "ambience"]):
            reverb_params = {
                "room_size": 0.5,
                "damping": 0.5,
                "wet_level": 0.33,
                "dry_level": 0.7
            }
            
            # Adjust parameters based on instructions
            if "large" in instructions or "hall" in instructions or "cathedral" in instructions:
                reverb_params["room_size"] = 0.85
                reverb_params["wet_level"] = 0.4
            elif "small" in instructions or "room" in instructions or "booth" in instructions:
                reverb_params["room_size"] = 0.3
                reverb_params["wet_level"] = 0.25
                
            effects_chain.append({
                "type": "reverb",
                "parameters": reverb_params
            })
        
        # Check for noise reduction
        if any(word in instructions for word in ["noise", "clean", "background", "hiss", "hum"]):
            noise_params = {
                "strength": 0.5,
                "sensitivity": 0.5
            }
            
            effects_chain.append({
                "type": "noise_reduction",
                "parameters": noise_params
            })
        
        # If no effects were detected, add a default subtle enhancement
        if not effects_chain and audio_analysis:
            # Check if audio needs enhancement based on analysis
            if audio_analysis.get("is_too_quiet", False):
                effects_chain.append({
                    "type": "gain",
                    "parameters": {"gain_db": 6}
                })
                
            if audio_analysis.get("noise_floor", 0) > 0.01:
                effects_chain.append({
                    "type": "noise_reduction",
                    "parameters": {"strength": 0.4, "sensitivity": 0.5}
                })
                
            # Add subtle enhancement EQ
            effects_chain.append({
                "type": "eq",
                "parameters": {"low": 1, "high": 1}
            })
        
        return effects_chain

# Create singleton instance
llm_processor = LLMProcessor()