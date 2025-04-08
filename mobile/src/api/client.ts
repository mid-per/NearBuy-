import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Flask server's local IP (run `ipconfig` on Windows)
const BASE_URL = 'http://192.168.1.159:5000/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 10 seconds timeout
});

// Add JWT auth interceptor
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config});

// Add response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration (will implement later)
      console.warn('Session expired - redirect to login');
    }
    return Promise.reject(error);
  }
);

export default client;