# AudioChat

AudioChat is an AI-powered audio engineering assistant that helps you edit, mix, and master audio files through natural language instructions. Simply upload your audio files, describe the changes you want to make in plain language, and let AudioChat handle the technical details of audio processing.

![AudioChat Screenshot](https://via.placeholder.com/800x450.png?text=AudioChat+Screenshot)

## Features

### Audio Engineering Capabilities
- **Natural Language Audio Editing**: Describe audio edits in plain language (e.g., "Make the vocals louder" or "Add more bass")
- **Automated Mixing**: Apply professional mixing techniques through AI-guided processing
- **Mastering Assistant**: Get AI assistance for finalizing and polishing your tracks
- **Audio Effect Suggestions**: Receive recommendations for effects and processing chains
- **Before/After Comparison**: Compare original and processed audio files

### Core Functionality
- **Multi-LLM Support**: Leverage different AI models specialized in audio engineering knowledge
- **Audio File Upload**: Upload WAV, MP3, FLAC, and other common audio formats
- **Project History**: Save and revisit previous audio editing projects
- **Export Options**: Download processed audio in various formats and quality settings

### User Experience
- **Audio Visualization**: Real-time waveform and spectrum visualization
- **Voice Input**: Describe desired audio changes using your voice
- **Chat Interface**: Discuss your audio project with the AI assistant
- **Audio Playback Controls**: Listen to specific sections before and after processing

### Interface & Design
- **Dark Theme**: Professional studio-like dark interface optimized for audio work
- **Audio Processing Settings**: Fine-tune default processing parameters
- **API Key Management**: Securely store and manage API keys for different providers
- **Responsive Design**: Works well on various screen sizes, from studio monitors to tablets

## Technology Stack

### Frontend
- React.js
- Context API for state management
- CSS for styling
- Web Audio API for audio visualization

### Backend
- Python FastAPI
- Audio processing libraries (librosa, pydub, SoundFile)
- Digital Signal Processing (DSP) for audio effects
- Machine learning models for intelligent audio processing
- API integrations with various LLM providers for audio engineering knowledge

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- Python (v3.8 or later)
- API keys for the LLM providers you want to use (OpenAI, Anthropic, Google)
- Google OAuth credentials for authentication (see AUTH_SETUP.md)

### Installation

#### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Run the setup script to create a virtual environment and install dependencies:
   ```
   setup.bat  # On Windows
   ./setup.sh  # On Linux/Mac
   ```

3. Create a `.env` file based on the `.env.example` template and add your API keys:
   ```
   cp .env.example .env
   ```

4. Start the backend server:
   ```
   run.bat  # On Windows
   ./run.sh  # On Linux/Mac
   ```

#### Frontend Setup
1. Install dependencies:
   ```
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env` and
   adjusting `REACT_APP_API_BASE` if your backend is hosted elsewhere.

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Running the Application

#### Start the Backend Server
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Run the setup script to create a virtual environment and install dependencies:
   ```
   setup.bat  # On Windows
   ./setup.sh  # On Linux/Mac
   ```

3. Start the backend server:
   ```
   run.bat  # On Windows
   ./run.sh  # On Linux/Mac
   ```

#### Start the Frontend
1. In a new terminal, install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Using the Audio Engineering Assistant

#### Uploading Audio Files
1. Sign in to your account using Google authentication
2. Click the "Upload" button in the interface or drag and drop your file
3. Select an audio file from your computer (WAV, MP3, FLAC, etc.)
4. Wait for the file to upload and process
5. The waveform visualization will appear once processing is complete
6. Your files are securely stored and accessible only to your account

#### Requesting Audio Edits
1. Type your desired audio edits in natural language
   - Example: "Reduce the background noise and make the vocals clearer"
   - Example: "Add a subtle reverb to the guitar and boost the low end"
2. Click "Process Audio"
3. The AI will analyze your request and apply appropriate audio processing
4. You'll receive the processed audio file with a description of changes made

#### Comparing Before/After
1. Use the audio player controls to listen to the original file
2. Use the second player to listen to the processed version
3. Compare specific sections to hear the differences

#### Fine-tuning Processing
1. If the results aren't exactly what you wanted, provide more specific feedback
   - Example: "That's good, but can you make the reverb more subtle?"
2. Click "Process Audio" again
3. The AI will apply incremental changes based on your feedback
4. Continue refining until you're satisfied with the results

#### Chatting with the Audio Engineer
1. Use the chat interface below the audio processing section
2. Ask questions about audio engineering techniques
3. Get advice on how to improve your audio
4. Learn about different audio effects and when to use them

## Project Structure

```
audiochat/
├── backend/               # Python FastAPI backend
│   ├── env/              # Python virtual environment
│   ├── main.py           # Main API entry point
│   └── requirements.txt  # Python dependencies
├── public/                # Static assets
└── src/                   # React frontend
    ├── components/        # UI components
    │   ├── AudioRecorder.js       # Voice recording component
    │   ├── AudioVisualizer.js     # Audio waveform visualization
    │   ├── ChatInterface.js       # Main chat interface
    │   ├── MessageList.js         # Chat message display
    │   └── VoiceSelector.js       # Voice selection component
    ├── context/           # React context providers
    │   └── SettingsContext.js     # Global settings management
    ├── services/          # API service functions
    │   └── api.js                 # Backend API integration
    └── App.js             # Main application component
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### API Keys
API keys can also be managed through the application interface:
1. Go to Settings > API Keys
2. Enter your API keys for each provider
3. Click "Save Keys"

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT models and Whisper API
- Anthropic for Claude models
- Google for Gemini models
- The React and FastAPI communities for excellent documentation and tools#
