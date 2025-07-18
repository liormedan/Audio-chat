import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ExtensionsManager.css';

/**
 * ExtensionsManager component for managing audio processing extensions
 * Allows users to view, enable, and disable extensions
 * Premium extensions are highlighted and can be enabled if the user has access
 */
const ExtensionsManager = () => {
  const { user, getAuthToken } = useAuth();
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch extensions on component mount
  useEffect(() => {
    fetchExtensions();
  }, []);

  // Fetch all available extensions for the current user
  const fetchExtensions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch('/api/extensions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch extensions: ${response.status}`);
      }

      const data = await response.json();
      setExtensions(data);
    } catch (err) {
      console.error('Error fetching extensions:', err);
      setError('Failed to load extensions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle extension enabled status
  const toggleExtension = async (extensionId, currentlyEnabled) => {
    try {
      const token = await getAuthToken();
      const endpoint = currentlyEnabled ? 
        `/api/extensions/${extensionId}/disable` : 
        `/api/extensions/${extensionId}/enable`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${currentlyEnabled ? 'disable' : 'enable'} extension: ${response.status}`);
      }

      // Update local state
      setExtensions(extensions.map(ext => 
        ext.id === extensionId ? { ...ext, enabled: !currentlyEnabled } : ext
      ));
    } catch (err) {
      console.error(`Error toggling extension ${extensionId}:`, err);
      setError(`Failed to ${currentlyEnabled ? 'disable' : 'enable'} extension. Please try again later.`);
    }
  };

  // Group extensions by category
  const extensionsByCategory = extensions.reduce((acc, extension) => {
    const category = extension.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(extension);
    return acc;
  }, {});

  if (loading) {
    return <div className="extensions-loading">Loading extensions...</div>;
  }

  if (error) {
    return <div className="extensions-error">{error}</div>;
  }

  return (
    <div className="extensions-manager">
      <h2>Audio Processing Extensions</h2>
      <p className="extensions-description">
        Enable or disable extensions to enhance your audio processing capabilities.
        Premium extensions provide advanced features for professional audio work.
      </p>

      {Object.entries(extensionsByCategory).map(([category, categoryExtensions]) => (
        <div key={category} className="extensions-category">
          <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
          <div className="extensions-grid">
            {categoryExtensions.map(extension => (
              <div 
                key={extension.id} 
                className={`extension-card ${extension.premium ? 'premium' : ''} ${extension.enabled ? 'enabled' : ''}`}
              >
                <div className="extension-header">
                  <h4>{extension.name}</h4>
                  {extension.premium && <span className="premium-badge">Premium</span>}
                </div>
                <p className="extension-description">{extension.description}</p>
                <div className="extension-footer">
                  <span className="extension-version">v{extension.version}</span>
                  <button 
                    className={`toggle-button ${extension.enabled ? 'enabled' : ''}`}
                    onClick={() => toggleExtension(extension.id, extension.enabled)}
                    disabled={extension.premium && !extension.enabled && !user?.isPremium}
                  >
                    {extension.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
                {extension.premium && !extension.enabled && !user?.isPremium && (
                  <div className="premium-overlay">
                    <p>Premium Feature</p>
                    <button className="upgrade-button">Upgrade</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {extensions.length === 0 && (
        <div className="no-extensions">
          <p>No extensions available. Check back later for new extensions.</p>
        </div>
      )}
    </div>
  );
};

export default ExtensionsManager;