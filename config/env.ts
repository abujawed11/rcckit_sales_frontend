// Environment configuration
export const ENV = {
  // API Base URL from environment variables
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rcckitportal.sun-rack.com/api/',
  
  // Add other environment variables here
  APP_NAME: 'RCC Kit Sales',
  VERSION: '1.0.0',
  
  // You can add different configurations for different environments
  TIMEOUT: 30000, // API timeout in milliseconds (30 seconds)
};