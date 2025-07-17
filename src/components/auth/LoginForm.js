import React, { useState } from 'react';
import authService from '../../services/auth';
import './AuthForms.css';

function LoginForm({ onSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.signIn(email, password);
      onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign In to AudioChat</h2>
      
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter your password"
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button primary"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className="auth-switch">
        Don't have an account?{' '}
        <button 
          type="button" 
          className="auth-link"
          onClick={onSwitchToSignup}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default LoginForm;