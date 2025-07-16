import React, { useState } from 'react';
import './ChatSidebar.css';

function ChatSidebar({ onSelectChat, activeChat }) {
  const [chats, setChats] = useState([
    { id: 1, title: 'Chat with GPT', model: 'OpenAI GPT', date: 'Today' },
    { id: 2, title: 'Claude Conversation', model: 'Anthropic Claude', date: 'Yesterday' },
    { id: 3, title: 'Gemini Chat', model: 'Google Gemini', date: 'Jul 15' },
    { id: 4, title: 'Local LLM Test', model: 'Local LLM', date: 'Jul 14' }
  ]);

  const [newChatName, setNewChatName] = useState('');
  
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: newChatName || `New Chat ${chats.length + 1}`,
      model: 'OpenAI GPT',
      date: 'Today'
    };
    setChats([newChat, ...chats]);
    setNewChatName('');
    onSelectChat(newChat);
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
      </div>
      
      <div className="new-chat-form">
        <input
          type="text"
          placeholder="New chat name..."
          value={newChatName}
          onChange={(e) => setNewChatName(e.target.value)}
          className="new-chat-input"
        />
        <button onClick={createNewChat} className="new-chat-button">
          + New Chat
        </button>
      </div>
      
      <div className="chat-list">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            className={`chat-item ${activeChat && activeChat.id === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="chat-item-title">{chat.title}</div>
            <div className="chat-item-meta">
              <span className="chat-item-model">{chat.model}</span>
              <span className="chat-item-date">{chat.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;