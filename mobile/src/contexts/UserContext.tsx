import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type User = {
  id: number;
  email: string;
  isAdmin: boolean;
};

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

// Update the loadUser function in UserContext.tsx
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('Token loaded from storage:', token?.slice(0, 20) + '...');
    
      if (token) {
      // Verify token matches current user
        const decoded = jwtDecode(token); // You'll need 'jwt-decode' package
        console.log('Decoded token:', decoded);
      
        if (decoded.sub !== user?.id?.toString()) {
          console.log('Token user mismatch, clearing');
          throw new Error('Token user mismatch');
        }

        const response = await client.get('/auth/me');
        console.log('User data verified:', response.data);
      
        setUser({
          id: response.data.id,
          email: response.data.email,
          isAdmin: response.data.is_admin || false
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
      logout: async () => {
        await AsyncStorage.removeItem('access_token');
        delete client.defaults.headers.common['Authorization'];
        setUser(null);
      }
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);