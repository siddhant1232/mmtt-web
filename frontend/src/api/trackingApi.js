// API configuration
// Update this to your backend URL (e.g., https://mmt-backend.onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Fetch latest location data for a device
 * @param {string} deviceId - Device ID (e.g., 'BSF_UNIT_01')
 * @returns {Promise<Object>} Latest location data
 */
export const fetchLatestLocation = async (deviceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/device/${deviceId}/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching latest location:', error);
    // Return mock data for development
    return {
      device_id: deviceId,
      lat: 29.8660,
      lon: 77.8905,
      speed: 0,
      battery: 100,
      sos: false,
      timestamp: Math.floor(Date.now() / 1000),
      accuracy: 5
    };
  }
};

/**
 * Fetch historical path data for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise<Array>} Array of coordinate points
 */
export const fetchHistory = async (deviceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/device/${deviceId}/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.coordinates || data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    // Return empty array for development
    return [];
  }
};

