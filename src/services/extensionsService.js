/**
 * Extensions Service
 * Handles API calls related to audio processing extensions
 */

// Helper function to get auth token
const getAuthToken = async () => {
  // This should be implemented based on your auth system
  // For now, return a placeholder token
  return 'dev_test_token';
};

/**
 * Fetch all available extensions for the current user
 * @returns {Promise<Array>} Array of extension objects
 */
export const getExtensions = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch('/api/extensions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch extensions: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching extensions:', error);
    throw error;
  }
};

/**
 * Get details for a specific extension
 * @param {string} extensionId - ID of the extension
 * @returns {Promise<Object>} Extension details
 */
export const getExtensionDetails = async (extensionId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/extensions/${extensionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch extension details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching extension details for ${extensionId}:`, error);
    throw error;
  }
};

/**
 * Enable an extension for the current user
 * @param {string} extensionId - ID of the extension to enable
 * @returns {Promise<Object>} Response object
 */
export const enableExtension = async (extensionId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/extensions/${extensionId}/enable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to enable extension: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error enabling extension ${extensionId}:`, error);
    throw error;
  }
};

/**
 * Disable an extension for the current user
 * @param {string} extensionId - ID of the extension to disable
 * @returns {Promise<Object>} Response object
 */
export const disableExtension = async (extensionId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/extensions/${extensionId}/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to disable extension: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error disabling extension ${extensionId}:`, error);
    throw error;
  }
};