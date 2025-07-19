import React from 'react';
import DirectLogin from '../auth/DirectLogin';
import './Pages.css';

function DirectLoginPage() {
  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-welcome">
          <h2>Welcome to AudioChat</h2>
          <p>Your AI-powered audio engineering assistant</p>
        </div>
        <DirectLogin />
      </div>
    </div>
  );
}

export default DirectLoginPage;