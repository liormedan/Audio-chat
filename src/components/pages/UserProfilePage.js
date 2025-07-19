import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import './Pages.css';

function UserProfilePage() {
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setDisplayName(settings.userProfile.displayName || user?.displayName || '');
    setEmail(settings.userProfile.email || user?.email || '');
  }, [settings.userProfile, user]);

  const handleSave = () => {
    updateSetting('userProfile', { displayName, email });
  };

  return (
    <div className="user-profile-settings">
      <div className="form-group">
        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />
      </div>
      <button className="settings-save" onClick={handleSave}>Save</button>
    </div>
  );
}

export default UserProfilePage;
