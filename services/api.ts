import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =====================================
// CENTRALIZED API CONFIGURATION
// =====================================

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rcckitportal.sun-rack.com/api/',
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: 'login/',
    LOGOUT: 'logout/',
    REGISTER: 'register/',
    TOKEN_REFRESH: 'token/refresh/',
    TOKEN_LOGOUT: 'token/logout/',
    
    // Business endpoints
    ENQUIRY: 'enquiry/',
    ORDERS: 'orders/',
    KITS: 'kits/',
    CLIENTS: 'clients/',
    LOCATIONS: 'locations/',
    CREATE_ORDER: 'create-order/',
    USER_ORDERS: 'orders/user/',
    CUSTOMER_ORDERS: 'orders/customer/',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// =====================================
// AXIOS INSTANCE WITH INTERCEPTORS
// =====================================

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.TOKEN_REFRESH), {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// =====================================
// API FUNCTIONS
// =====================================

// Auth API functions
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.LOGIN, { username, password });
    return response.data;
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post(API_CONFIG.ENDPOINTS.TOKEN_LOGOUT, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    }
  },

  register: async (userData: any) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.REGISTER, userData);
    return response.data;
  },
};

// Enquiry API functions
export const enquiryAPI = {
  getAll: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.ENQUIRY);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.ENQUIRY}${id}/`);
    return response.data;
  },

  create: async (enquiryData: any) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.ENQUIRY, enquiryData);
    return response.data;
  },

  update: async (id: string, enquiryData: any) => {
    const response = await api.put(`${API_CONFIG.ENDPOINTS.ENQUIRY}${id}/`, enquiryData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${API_CONFIG.ENDPOINTS.ENQUIRY}${id}/`);
    return response.data;
  },
};

// Kit API functions
export const kitAPI = {
  getAll: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.KITS);
    return response.data;
  },

  getById: async (kitId: string) => {
    const response = await api.get(`kit/${kitId}/`);
    return response.data;
  },
};

// Order API functions
export const orderAPI = {
  getAll: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.ORDERS);
    return response.data;
  },

  getById: async (orderId: string) => {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.ORDERS}${orderId}/`);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.USER_ORDERS);
    return response.data;
  },

  getCustomerOrders: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.CUSTOMER_ORDERS);
    return response.data;
  },

  create: async (orderData: any) => {
    const response = await api.post(API_CONFIG.ENDPOINTS.CREATE_ORDER, orderData);
    return response.data;
  },
};

// Client API functions
export const clientAPI = {
  getAll: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.CLIENTS);
    return response.data;
  },
};

// Location API functions
export const locationAPI = {
  getAll: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.LOCATIONS);
    return response.data;
  },
};

// =====================================
// UTILITY FUNCTIONS
// =====================================

// Utility function to store auth tokens
export const storeAuthTokens = async (tokens: {
  access: string;
  refresh: string;
  user?: any;
}) => {
  try {
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    if (tokens.user) {
      await AsyncStorage.setItem('user_data', JSON.stringify(tokens.user));
    }
  } catch (error) {
    console.error('Error storing auth tokens:', error);
  }
};

// Utility function to get stored user data
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Export the axios instance for direct use if needed
export default api;