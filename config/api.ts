// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rcckitportal.sun-rack.com/api/',
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    LOGIN: 'login/',
    LOGOUT: 'logout/',
    ENQUIRY: 'enquiry/',
    // Add more endpoints as needed
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;