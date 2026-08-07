import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// NOTE: Replace this IP with your local machine's IP (e.g., http://192.168.1.100:8000)
// if you are testing on a physical mobile device or android emulator.
export const BASE_URL = 'https://crm-vivivan.onrender.com';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from SecureStore to every request
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Could not read user_token from SecureStore', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses for global error handling (e.g. 401 Unauthorized redirect)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Clearing session token.');
      try {
        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('user_profile');
      } catch (e) {
        console.warn('Could not clear session data', e);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
