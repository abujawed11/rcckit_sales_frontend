// Environment configuration
export const ENV = {
  // Update this with your actual backend server URL
  API_BASE_URL: __DEV__ 
    ? 'http://10.20.2.78:8001/api/' // Development URL - localhost
    : 'https://your-production-api.com/api/', // Production URL
  
  // Add other environment variables here
  APP_NAME: 'RCC Kit Sales',
  VERSION: '1.0.0',
  
  // You can add different configurations for different environments
  TIMEOUT: 10000, // API timeout in milliseconds
};