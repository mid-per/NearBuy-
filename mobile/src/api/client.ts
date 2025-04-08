import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({
  baseURL: 'http://YOUR_LOCAL_IP:5000/api', // Update with your backend IP
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;