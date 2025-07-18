import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Welcome to AudioChat</h1>
        <p className="home-subtitle">Your AI-powered audio engineering assistant</p>
      </header>
      
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h2 className="feature-title">Chat with AI</h2>
          <p className="feature-description">
            Get expert advice on audio engineering, mixing, and production techniques.
          </p>
          <button className="feature-button">Start a Chat</button>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🎵</div>
          <h2 className="feature-title">Process Audio</h2>
          <p className="feature-description">
            Upload and process your audio files with AI-powered tools and effects.
          </p>
          <button className="feature-button">Upload Audio</button>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h2 className="feature-title">Extensions</h2>
          <p className="feature-description">
            Enhance your workflow with specialized audio processing extensions.
          </p>
          <button className="feature-button">Browse Extensions</button>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h2 className="feature-title">Audio Analysis</h2>
          <p className="feature-description">
            Get detailed analysis of your audio files to improve your mixes.
          </p>
          <button className="feature-button">Analyze Audio</button>
        </div>
      </div>
      
      <section className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">💬</div>
            <div className="activity-content">
              <h3 className="activity-title">Chat: Mixing Vocals</h3>
              <p className="activity-time">Today, 2:30 PM</p>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">🎵</div>
            <div className="activity-content">
              <h3 className="activity-title">Processed: drum_loop.wav</h3>
              <p className="activity-time">Yesterday, 4:15 PM</p>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">📊</div>
            <div className="activity-content">
              <h3 className="activity-title">Analyzed: vocal_take.mp3</h3>
              <p className="activity-time">Jul 15, 10:20 AM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;