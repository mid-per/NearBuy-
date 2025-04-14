import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  is_admin: boolean;
}

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('Token loaded from storage:', token?.slice(0, 20) + '...');
    
      if (token) {
        const decoded = jwtDecode(token) as { sub?: string };
        console.log('Decoded token:', decoded);
      
        const response = await client.get<User>('/auth/me');
        console.log('User data verified:', response.data);
      
        // Ensure we handle null values from backend
        setUser({
          id: response.data.id,
          email: response.data.email,
          name: response.data.name || null,
          avatar: response.data.avatar || null,
          is_admin: response.data.is_admin || false
        });
      }
    } catch (error) {
      console.error('Failed to load user', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    setUser(null);
    delete client.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser,
      loading,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);