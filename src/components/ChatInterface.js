import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AudioProcessingInterface from './AudioProcessingInterface';
import { sendChatMessage, processAudio } from '../services/api';
import './ChatInterface.css';

function ChatInterface({ selectedLLM, messages, setMessages, activeChat }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare the messages array for the API call
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      messageHistory.push({
        role: 'user',
        content
      });
      
      // Send the message to our backend API
      const response = await sendChatMessage(messageHistory, selectedLLM.id);
      
      // We're not using text-to-speech in this version
      let audioUrl = null;
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: selectedLLM.name,
        audioUrl
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.message || t('chat.errorResponse')}`,
        timestamp: new Date(),
        model: selectedLLM.name,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>{activeChat ? activeChat.title : t('chat.titleFallback')}</h2>
        <span className="chat-model">{selectedLLM.name}</span>
      </div>
      
      <AudioProcessingInterface />
      
      <div className="chat-section">
        <h3>{t('chat.sectionTitle')}</h3>
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
        <MessageInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

// Audio playback is now handled in the MessageList component

export default ChatInterface;