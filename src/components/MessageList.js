import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import './MessageList.css';

function MessageList({ messages, isLoading }) {
  const [playingAudio, setPlayingAudio] = useState(null);
  const { settings } = useSettings();
  
  // Auto-play the latest audio message when it arrives
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (
      settings.autoPlayAudio && 
      latestMessage && 
      latestMessage.role === 'assistant' && 
      latestMessage.audioUrl && 
      !playingAudio
    ) {
      handlePlayAudio(latestMessage.audioUrl, latestMessage.id);
    }
  }, [messages, settings.autoPlayAudio]);
  
  const handlePlayAudio = (audioUrl, messageId) => {
    if (playingAudio === messageId) {
      // If already playing this message, stop it
      setPlayingAudio(null);
    } else {
      // Play the audio for this message
      setPlayingAudio(messageId);
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        setPlayingAudio(null);
      });
    }
  };
  
  return (
    <div className="message-list">
      {messages.map(message => (
        <div key={message.id} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
          <div className="message-avatar">
            {message.role === 'user' ? 'U' : 'AI'}
          </div>
          <div className="message-bubble">
          <div className="message-content">
              <span className="message-text">{message.content}</span>
                {message.audioUrl && (
                <button
                  className={`audio-play-button ${playingAudio === message.id ? 'playing' : ''}`}
                  onClick={() => handlePlayAudio(message.audioUrl, message.id)}
                  title={playingAudio === message.id ? "Stop audio" : "Play audio"}
                  aria-label={playingAudio === message.id ? 'Stop audio' : 'Play audio'}
                >
                  {playingAudio === message.id ? '■' : '▶'}
                </button>
                )}
                <button
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  aria-label="Copy message"
                  title="Copy message"
                >
                  Copy
                </button>
          </div>
            <div className="message-meta">
              {message.model && `${message.model} • `}
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="message assistant">
          <div className="message-avatar">AI</div>
          <div className="message-bubble">
            <div className="message-content loading-indicator">
              Thinking
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;