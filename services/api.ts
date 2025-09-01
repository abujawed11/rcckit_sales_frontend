import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

// Base URL for your Django backend
const BASE_URL = ENV.API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: ENV.TIMEOUT,
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
          const response = await axios.post(`${BASE_URL}token/refresh/`, {
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
        // You can add navigation to login screen here
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API functions
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('login/', { username, password });
    return response.data;
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('token/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    }
  },

  register: async (userData: any) => {
    const response = await api.post('register/', userData);
    return response.data;
  },
};

// Enquiry API functions
export const enquiryAPI = {
  getAll: async () => {
    const response = await api.get('enquiry/');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`enquiry/${id}/`);
    return response.data;
  },

  create: async (enquiryData: any) => {
    const response = await api.post('enquiry/', enquiryData);
    return response.data;
  },

  update: async (id: string, enquiryData: any) => {
    const response = await api.put(`enquiry/${id}/`, enquiryData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`enquiry/${id}/`);
    return response.data;
  },
};

// Kit API functions
export const kitAPI = {
  getAll: async () => {
    const response = await api.get('kits/');
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
    const response = await api.get('orders/');
    return response.data;
  },

  getById: async (orderId: string) => {
    const response = await api.get(`orders/${orderId}/`);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get('orders/user/');
    return response.data;
  },

  getCustomerOrders: async () => {
    const response = await api.get('orders/customer/');
    return response.data;
  },

  create: async (orderData: any) => {
    const response = await api.post('create-order/', orderData);
    return response.data;
  },
};

// Client API functions
export const clientAPI = {
  getAll: async () => {
    const response = await api.get('clients/');
    return response.data;
  },
};

// Location API functions
export const locationAPI = {
  getAll: async () => {
    const response = await api.get('locations/');
    return response.data;
  },
};

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