from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, Request, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
import json
import logging
import shutil
import tempfile
from datetime import datetime
import uuid
import numpy as np
from pathlib import Path
import jwt
import requests

# Audio processing imports
try:
    import librosa
    import soundfile as sf
    from pydub import AudioSegment
    from audio_processing import audio_processor
    from advanced_audio_effects import advanced_effects
    from audio_export import audio_exporter
except ImportError:
    logging.warning("Audio processing libraries not installed. Some features may not work.")
    pass

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AudioChat API",
    description="Backend API for AudioChat application - Audio Engineering Assistant",
    version="1.0.0",
)

# Create directories for storing audio files
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# Mount static files for serving processed audio
app.mount("/audio", StaticFiles(directory="processed"), name="processed_audio")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Message(BaseModel):
    content: str
    role: str = "user"
    model: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    model: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class TranscriptionRequest(BaseModel):
    audio_file_path: str
    language: Optional[str] = "en"

class TextToSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"

# Mock database
conversations = {}
api_keys = {}
user_files = {}  # Store user files mapping: user_id -> [file_info]

# Authentication setup
security = HTTPBearer()

# Authentication functions
async def verify_google_token(token: str):
    """Verify Google ID token"""
    try:
        # Load Google client ID from environment
        google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if not google_client_id:
            logger.warning("GOOGLE_CLIENT_ID not set in environment")
            # Use the client ID from the client_secret file as fallback
            google_client_id = "484800218204-8snu9s0vvc9176aqug9759ulh1rio431.apps.googleusercontent.com"
        
        # In production, you would verify the token with Google's API
        # For development purposes, we'll use a simplified approach
        # This should be replaced with proper verification in production
        
        # Decode the token (without verification for development)
        # WARNING: In production, use proper verification with Google's API
        try:
            # Simple JWT decode without verification (FOR DEVELOPMENT ONLY)
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Check if token is for our app
            if payload.get("aud") != google_client_id:
                logger.warning(f"Token audience mismatch: {payload.get('aud')} vs {google_client_id}")
                return None
                
            return {
                "uid": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name")
            }
        except jwt.PyJWTError as e:
            logger.error(f"JWT decode error: {str(e)}")
            return None
            
    except Exception as e:
        logger.error(f"Error verifying Google token: {str(e)}")
        return None

async def verify_firebase_token(token: str):
    """Verify Firebase ID token"""
    try:
        # For development, we'll use a simplified approach
        # This should be replaced with Firebase Admin SDK verification in production
        
        # Try to decode the token (without verification for development)
        try:
            # Simple JWT decode without verification (FOR DEVELOPMENT ONLY)
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Check if it looks like a Firebase token
            if "firebase" not in payload:
                return None
                
            return {
                "uid": payload.get("user_id") or payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name")
            }
        except jwt.PyJWTError:
            return None
            
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {str(e)}")
        return None

async def verify_supabase_token(token: str):
    """Verify Supabase JWT token"""
    try:
        # For development, we'll use a simplified approach
        # This should be replaced with proper JWT verification in production
        
        # Try to decode the token (without verification for development)
        try:
            # Simple JWT decode without verification (FOR DEVELOPMENT ONLY)
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Check if it looks like a Supabase token
            if "aud" not in payload or payload.get("aud") != "authenticated":
                return None
                
            return {
                "sub": payload.get("sub"),
                "email": payload.get("email")
            }
        except jwt.PyJWTError:
            return None
            
    except Exception as e:
        logger.error(f"Error verifying Supabase token: {str(e)}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    
    # Try Google OAuth first
    user = await verify_google_token(token)
    if user:
        return {"id": user["uid"], "email": user.get("email"), "provider": "google"}
    
    # Try Firebase
    user = await verify_firebase_token(token)
    if user:
        return {"id": user["uid"], "email": user.get("email"), "provider": "firebase"}
    
    # Try Supabase
    user = await verify_supabase_token(token)
    if user:
        return {"id": user["sub"], "email": user.get("email"), "provider": "supabase"}
    
    # For development, allow a special test token
    if token == "dev_test_token":
        return {"id": "test_user_123", "email": "test@example.com", "provider": "development"}
    
    raise HTTPException(status_code=401, detail="Invalid authentication token")

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to AudioChat API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# LLM API routes
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Process a chat request with the specified LLM model
    """
    try:
        model = request.model
        logger.info(f"Processing chat request with model: {model}")
        
        # In a real implementation, this would call the appropriate LLM API
        # For now, we'll return a mock response
        response = {
            "id": str(uuid.uuid4()),
            "model": model,
            "created": datetime.now().timestamp(),
            "content": f"This is a mock response from the {model} model. In a real implementation, this would be generated by the LLM API.",
            "role": "assistant"
        }
        
        return response
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text
    """
    try:
        # Save the uploaded file temporarily
        file_path = f"temp_{uuid.uuid4()}.wav"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        logger.info(f"Audio file saved to {file_path}")
        
        # In a real implementation, this would call a speech-to-text API
        # For now, we'll return a mock transcription
        transcription = "This is a mock transcription of the uploaded audio file."
        
        # Clean up the temporary file
        os.remove(file_path)
        
        return {"text": transcription}
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/synthesize")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech
    """
    try:
        # In a real implementation, this would call a text-to-speech API
        # For now, we'll return a mock audio URL
        audio_url = f"https://example.com/audio/{uuid.uuid4()}.mp3"
        
        return {"audio_url": audio_url}
    except Exception as e:
        logger.error(f"Error synthesizing speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# API key management
@app.post("/api/keys")
async def save_api_key(provider: str = Form(...), key: str = Form(...)):
    """
    Save API key for a provider
    """
    try:
        # In a real implementation, this would securely store the API key
        # For now, we'll just store it in memory
        api_keys[provider] = key
        return {"status": "success", "message": f"API key for {provider} saved successfully"}
    except Exception as e:
        logger.error(f"Error saving API key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/keys/{provider}")
async def get_api_key(provider: str):
    """
    Get API key for a provider
    """
    if provider not in api_keys:
        raise HTTPException(status_code=404, detail=f"No API key found for {provider}")
    
    # In a real implementation, this would return a masked version of the key
    return {"provider": provider, "key": "********"}

# Conversation management
@app.post("/api/conversations")
async def create_conversation(title: str = Form(...)):
    """
    Create a new conversation
    """
    conversation_id = str(uuid.uuid4())
    conversations[conversation_id] = {
        "id": conversation_id,
        "title": title,
        "created_at": datetime.now().isoformat(),
        "messages": []
    }
    return conversations[conversation_id]

@app.get("/api/conversations")
async def list_conversations():
    """
    List all conversations
    """
    return list(conversations.values())

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    Get a specific conversation
    """
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations[conversation_id]

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete a conversation
    """
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    del conversations[conversation_id]
    return {"status": "success", "message": "Conversation deleted"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Audio processing models
class AudioProcessingRequest(BaseModel):
    file_id: str
    instructions: str
    effects: Optional[List[Dict[str, Any]]] = None
    segment: Optional[Dict[str, float]] = None  # {"start": start_time_in_seconds, "end": end_time_in_seconds}

class AudioEffect(BaseModel):
    type: str  # eq, compression, reverb, etc.
    parameters: Dict[str, Any]

# Audio processing functions
def apply_eq(audio_data, sample_rate, parameters):
    """Apply equalization to audio data"""
    try:
        # This is a simplified example - in a real implementation, 
        # we would use proper DSP techniques for equalization
        import librosa.effects as effects
        
        # Extract parameters
        low_shelf = parameters.get('low_shelf', 0)
        low_mid = parameters.get('low_mid', 0)
        mid = parameters.get('mid', 0)
        high_mid = parameters.get('high_mid', 0)
        high = parameters.get('high', 0)
        
        # Apply simple gain adjustments to different frequency bands
        # This is a very simplified approach - real EQ would use filters
        if low_shelf != 0:
            # Apply low shelf EQ (affect frequencies below 250Hz)
            low_mask = librosa.filters.mr_frequencies(sample_rate) < 250
            audio_data[:, low_mask] = audio_data[:, low_mask] * (10 ** (low_shelf / 20))
            
        # Similar processing for other bands...
        
        return audio_data
    except Exception as e:
        logger.error(f"Error applying EQ: {str(e)}")
        return audio_data

def apply_compression(audio_data, parameters):
    """Apply dynamic range compression to audio data"""
    try:
        # Extract parameters
        threshold = parameters.get('threshold', -20)
        ratio = parameters.get('ratio', 4)
        attack = parameters.get('attack', 5)
        release = parameters.get('release', 50)
        
        # Simple compression algorithm
        # This is a simplified version - real compression would be more sophisticated
        threshold_linear = 10 ** (threshold / 20)
        
        # Calculate gain reduction
        gain_reduction = np.zeros_like(audio_data)
        for i in range(len(audio_data)):
            if abs(audio_data[i]) > threshold_linear:
                gain_reduction[i] = abs(audio_data[i]) / threshold_linear
                gain_reduction[i] = gain_reduction[i] ** (1/ratio - 1)
            else:
                gain_reduction[i] = 1.0
                
        # Apply gain reduction
        compressed_audio = audio_data * gain_reduction
        
        return compressed_audio
    except Exception as e:
        logger.error(f"Error applying compression: {str(e)}")
        return audio_data

def apply_reverb(audio_data, sample_rate, parameters):
    """Apply reverb effect to audio data"""
    try:
        # Extract parameters
        room_size = parameters.get('room_size', 0.5)
        damping = parameters.get('damping', 0.5)
        wet_level = parameters.get('wet_level', 0.33)
        dry_level = parameters.get('dry_level', 0.4)
        
        # Simple convolution reverb
        # In a real implementation, we would use a proper reverb algorithm or IR convolution
        reverb_time = int(room_size * sample_rate)
        impulse_response = np.zeros(reverb_time)
        decay = np.linspace(1, 0, reverb_time) ** damping
        impulse_response = decay * np.random.randn(reverb_time)
        
        # Apply convolution
        from scipy import signal
        reverb_audio = signal.convolve(audio_data, impulse_response, mode='full')[:len(audio_data)]
        
        # Mix dry and wet signals
        output = dry_level * audio_data + wet_level * reverb_audio
        
        # Normalize to prevent clipping
        if np.max(np.abs(output)) > 1.0:
            output = output / np.max(np.abs(output))
            
        return output
    except Exception as e:
        logger.error(f"Error applying reverb: {str(e)}")
        return audio_data

# Audio file routes with authentication
@app.post("/api/audio/upload")
async def upload_audio(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Upload an audio file for processing (authenticated)
    """
    try:
        # Validate file size (50MB limit)
        max_size = 50 * 1024 * 1024
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
        
        # Validate file type
        allowed_types = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid audio file.")
        
        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        user_id = current_user["id"]
        
        # Create user-specific directory
        user_upload_dir = UPLOAD_DIR / user_id
        user_upload_dir.mkdir(exist_ok=True)
        
        file_path = user_upload_dir / f"{file_id}{file_extension}"
        
        # Save the uploaded file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"Audio file saved to {file_path} for user {user_id}")
        
        # Get basic audio information
        try:
            y, sr = librosa.load(file_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Generate waveform data for visualization (downsampled)
            waveform = librosa.resample(y, orig_sr=sr, target_sr=100)
            waveform = waveform[:1000].tolist()  # Limit number of points
            
            audio_info = {
                "file_id": file_id,
                "filename": file.filename,
                "duration": duration,
                "sample_rate": sr,
                "channels": 1 if len(y.shape) == 1 else y.shape[0],
                "waveform": waveform,
                "size": len(file_content),
                "uploaded_at": datetime.now().isoformat(),
                "user_id": user_id
            }
        except Exception as e:
            logger.error(f"Error analyzing audio: {str(e)}")
            audio_info = {
                "file_id": file_id,
                "filename": file.filename,
                "size": len(file_content),
                "uploaded_at": datetime.now().isoformat(),
                "user_id": user_id
            }
        
        # Store file info in user files database
        if user_id not in user_files:
            user_files[user_id] = []
        user_files[user_id].append(audio_info)
        
        return audio_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/process")
async def process_audio(request: AudioProcessingRequest, current_user: dict = Depends(get_current_user)):
    """
    Process an audio file based on natural language instructions (authenticated)
    Uses advanced audio processing capabilities to interpret and apply effects
    Supports processing specific segments of audio
    """
    try:
        # Find the original file in user's directory
        file_id = request.file_id
        user_id = current_user["id"]
        user_upload_dir = UPLOAD_DIR / user_id
        
        original_files = list(user_upload_dir.glob(f"{file_id}.*"))
        
        if not original_files:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        original_file = original_files[0]
        file_extension = original_file.suffix
        
        # Load the audio file
        y, sr = librosa.load(original_file, sr=None)
        
        # Extract segment if specified
        full_audio = y.copy()
        segment_info = None
        
        if request.segment:
            start_time = request.segment.get("start", 0)
            end_time = request.segment.get("end", None)
            
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
            
            # Save segment info for response
            segment_info = {
                "start": start_time,
                "end": end_time if end_time is not None else start_time + (len(y) / sr),
                "duration": len(y) / sr
            }
            
            logger.info(f"Processing segment: {start_time}s to {segment_info['end']}s")
        
        # Analyze the audio to get its characteristics
        audio_analysis = audio_processor.analyze_audio(y, sr)
        logger.info(f"Audio analysis: {audio_analysis}")
        
        # Process the audio using our advanced audio processor
        if request.effects:
            # Use explicitly provided effects chain if available
            processed_audio, processing_steps = audio_processor.process_audio(
                y, sr, request.instructions, request.effects
            )
        else:
            # Otherwise, parse natural language instructions
            processed_audio, processing_steps = audio_processor.process_audio(
                y, sr, request.instructions
            )
        
        # If we processed a segment, merge it back into the full audio
        if segment_info:
            start_sample = int(segment_info["start"] * sr)
            end_sample = start_sample + len(processed_audio)
            
            # Create a copy of the full audio and replace the segment
            merged_audio = full_audio.copy()
            merged_audio[start_sample:end_sample] = processed_audio
            processed_audio = merged_audio
        
        # Save the processed audio
        processed_file_id = str(uuid.uuid4())
        processed_file_path = PROCESSED_DIR / f"{processed_file_id}{file_extension}"
        sf.write(processed_file_path, processed_audio, sr)
        
        # Generate response with processing details
        response = {
            "original_file_id": file_id,
            "processed_file_id": processed_file_id,
            "processing_steps": processing_steps,
            "audio_url": f"/audio/{processed_file_path.name}",
            "instructions": request.instructions,
            "audio_analysis": audio_analysis,
            "segment": segment_info
        }
        
        return response
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# User file management endpoints
@app.get("/api/user/files")
async def get_user_files(current_user: dict = Depends(get_current_user)):
    """
    Get all files for the authenticated user
    """
    try:
        user_id = current_user["id"]
        return user_files.get(user_id, [])
    except Exception as e:
        logger.error(f"Error retrieving user files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/user/files/{file_id}")
async def delete_user_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a user's file
    """
    try:
        user_id = current_user["id"]
        
        # Find and remove file from user's file list
        if user_id in user_files:
            user_files[user_id] = [f for f in user_files[user_id] if f["file_id"] != file_id]
        
        # Delete physical file
        user_upload_dir = UPLOAD_DIR / user_id
        file_deleted = False
        
        for file_path in user_upload_dir.glob(f"{file_id}.*"):
            file_path.unlink()
            file_deleted = True
            logger.info(f"Deleted file {file_path} for user {user_id}")
        
        if not file_deleted:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {"status": "success", "message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/{file_id}")
async def get_audio_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get an audio file by ID (authenticated)
    """
    try:
        user_id = current_user["id"]
        
        # Check processed files first
        processed_files = list(PROCESSED_DIR.glob(f"{file_id}.*"))
        if processed_files:
            return FileResponse(processed_files[0])
            
        # Then check user's original files
        user_upload_dir = UPLOAD_DIR / user_id
        original_files = list(user_upload_dir.glob(f"{file_id}.*"))
        if original_files:
            return FileResponse(original_files[0])
            
        raise HTTPException(status_code=404, detail="Audio file not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving audio file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/{file_id}/waveform")
async def get_audio_waveform(file_id: str, points: int = 1000, current_user: dict = Depends(get_current_user)):
    """
    Get waveform data for visualization (authenticated)
    """
    try:
        user_id = current_user["id"]
        
        # Find the file
        processed_files = list(PROCESSED_DIR.glob(f"{file_id}.*"))
        
        # Check user's original files
        user_upload_dir = UPLOAD_DIR / user_id
        original_files = list(user_upload_dir.glob(f"{file_id}.*"))
        
        file_path = None
        if processed_files:
            file_path = processed_files[0]
        elif original_files:
            file_path = original_files[0]
        else:
            raise HTTPException(status_code=404, detail="Audio file not found")
            
        # Load and downsample the audio
        y, sr = librosa.load(file_path, sr=None)
        
        # Generate waveform data (downsampled)
        waveform = librosa.resample(y, orig_sr=sr, target_sr=points/librosa.get_duration(y=y, sr=sr))
        waveform = waveform[:points].tolist()
        
        return {
            "file_id": file_id,
            "waveform": waveform,
            "sample_rate": sr,
            "duration": librosa.get_duration(y=y, sr=sr)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating waveform: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))@ap
p.post("/api/audio/export")
async def export_audio(
    file_id: str = Form(...),
    format: str = Form(...),
    quality: str = Form("high"),
    current_user: dict = Depends(get_current_user)
):
    """
    Export audio file in different formats and quality settings
    
    Args:
        file_id: ID of the audio file to export
        format: Output format ('wav', 'mp3', 'flac', 'ogg', 'aac')
        quality: Quality setting ('low', 'medium', 'high')
    """
    try:
        user_id = current_user["id"]
        
        # Find the file (check processed files first, then user's original files)
        file_path = None
        
        # Check processed files first
        processed_files = list(PROCESSED_DIR.glob(f"{file_id}.*"))
        if processed_files:
            file_path = processed_files[0]
        else:
            # Then check user's original files
            user_upload_dir = UPLOAD_DIR / user_id
            original_files = list(user_upload_dir.glob(f"{file_id}.*"))
            if original_files:
                file_path = original_files[0]
        
        if not file_path:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Load the audio file
        y, sr = librosa.load(file_path, sr=None)
        
        # Export the audio in the requested format
        export_result = audio_exporter.export_audio(
            audio_data=y,
            sample_rate=sr,
            file_id=f"export_{file_id}",
            format=format,
            quality=quality
        )
        
        return export_result
    except Exception as e:
        logger.error(f"Error exporting audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/formats")
async def get_supported_formats():
    """
    Get list of supported audio export formats
    """
    formats = [
        {
            "id": "wav",
            "name": "WAV",
            "description": "Uncompressed audio format with highest quality",
            "qualities": [
                {"id": "low", "name": "Low (16-bit)", "description": "16-bit PCM"},
                {"id": "medium", "name": "Medium (24-bit)", "description": "24-bit PCM"},
                {"id": "high", "name": "High (32-bit float)", "description": "32-bit floating point"}
            ]
        },
        {
            "id": "mp3",
            "name": "MP3",
            "description": "Compressed audio format with good compatibility",
            "qualities": [
                {"id": "low", "name": "Low (128kbps)", "description": "128kbps bitrate"},
                {"id": "medium", "name": "Medium (192kbps)", "description": "192kbps bitrate"},
                {"id": "high", "name": "High (320kbps)", "description": "320kbps bitrate"}
            ]
        },
        {
            "id": "flac",
            "name": "FLAC",
            "description": "Lossless compressed audio format",
            "qualities": [
                {"id": "medium", "name": "Standard", "description": "Standard compression level"},
                {"id": "high", "name": "Best", "description": "Best compression level"}
            ]
        },
        {
            "id": "ogg",
            "name": "OGG Vorbis",
            "description": "Free and open-source compressed audio format",
            "qualities": [
                {"id": "low", "name": "Low (96kbps)", "description": "96kbps bitrate"},
                {"id": "medium", "name": "Medium (160kbps)", "description": "160kbps bitrate"},
                {"id": "high", "name": "High (256kbps)", "description": "256kbps bitrate"}
            ]
        },
        {
            "id": "aac",
            "name": "AAC",
            "description": "Advanced Audio Coding format used by Apple",
            "qualities": [
                {"id": "low", "name": "Low (128kbps)", "description": "128kbps bitrate"},
                {"id": "medium", "name": "Medium (192kbps)", "description": "192kbps bitrate"},
                {"id": "high", "name": "High (256kbps)", "description": "256kbps bitrate"}
            ]
        }
    ]
    
    return formats