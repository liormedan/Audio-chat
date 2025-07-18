import React, { useState, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import './MessageInput.css';

function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleAudioRecorded = (transcribedText, audioBlob) => {
    setMessage(transcribedText);
    // Adjust the textarea height after setting the transcribed text
    setTimeout(adjustTextareaHeight, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <AudioRecorder onAudioRecorded={handleAudioRecorded} />
      <textarea
        ref={textareaRef}
        value={message}
        aria-label="Message input"
        onChange={(e) => {
          setMessage(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        className="message-textarea"
        disabled={disabled}
      />
      <button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className="send-button"
      >
        Send
      </button>
    </form>
  );
}

export default MessageInput;