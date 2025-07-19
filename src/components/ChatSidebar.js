import React, { useState, useEffect } from 'react';
import './ChatSidebar.css';

// Helper function to format date
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

function ChatSidebar({ onSelectChat, activeChat }) {
  // Initialize with empty chats array
  const [chats, setChats] = useState([]);
  const [newChatName, setNewChatName] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('audioChat_recentChats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        
        // If there are saved chats, select the most recent one
        if (parsedChats.length > 0 && !activeChat) {
          onSelectChat(parsedChats[0]);
        }
      } catch (error) {
        console.error('Error parsing saved chats:', error);
      }
    } else {
      // Create a default chat if no saved chats exist
      createDefaultChat();
    }
  }, []);
  
  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('audioChat_recentChats', JSON.stringify(chats));
    }
  }, [chats]);
  
  const createDefaultChat = () => {
    const defaultChat = {
      id: Date.now(),
      title: 'New Chat',
      model: 'OpenAI GPT',
      date: formatDate(new Date()),
      timestamp: Date.now()
    };
    
    setChats([defaultChat]);
    onSelectChat(defaultChat);
  };
  
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: newChatName || 'New Chat',
      model: activeChat?.model || 'OpenAI GPT',
      date: formatDate(new Date()),
      timestamp: Date.now()
    };
    
    // Add new chat to the beginning of the list
    const updatedChats = [newChat, ...chats];
    
    // Keep only the 10 most recent chats
    const limitedChats = updatedChats.slice(0, 10);
    
    setChats(limitedChats);
    setNewChatName('');
    setIsCreatingChat(false);
    onSelectChat(newChat);
  };
  
  const deleteChat = (e, chatId) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // If the active chat was deleted, select the first available chat
    if (activeChat && activeChat.id === chatId && updatedChats.length > 0) {
      onSelectChat(updatedChats[0]);
    } else if (updatedChats.length === 0) {
      // If no chats remain, create a new default chat
      createDefaultChat();
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      createNewChat();
    }
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button
          className="new-chat-icon-button"
          onClick={() => setIsCreatingChat(true)}
          title="New Chat"
          aria-label="New Chat"
        >
          +
        </button>
      </div>
      
      {isCreatingChat && (
        <div className="new-chat-form">
          <input
            type="text"
            placeholder="Enter chat name..."
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="new-chat-input"
            autoFocus
          />
          <div className="new-chat-actions">
            <button 
              onClick={() => setIsCreatingChat(false)}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              onClick={createNewChat}
              className="create-button"
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="no-chats-message">
            <p>No recent chats</p>
            <button 
              onClick={() => setIsCreatingChat(true)}
              className="start-chat-button"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChat && activeChat.id === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-item-content">
                <div className="chat-item-title">{chat.title}</div>
                <div className="chat-item-meta">
                  <span className="chat-item-date">{chat.date}</span>
                </div>
              </div>
              <button
                className="delete-chat-button"
                onClick={(e) => deleteChat(e, chat.id)}
                title="Delete chat"
                aria-label="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;