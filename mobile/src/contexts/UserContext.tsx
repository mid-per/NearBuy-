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
  bio: string | null;       
  location: string | null;  
  phone: string | null;
  rating?: number;
}

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; 
  updateUserField: (field: keyof User, value: any) => void; 
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
  refreshUser: async () => {}, 
  updateUserField: () => {} 
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
    
      if (token) {
        const response = await client.get<User>(`/auth/me?${Date.now()}`); // Cache busting
        const userResponse = await client.get(`/users/${response.data.id}`);
      
        setUser({
          id: userResponse.data.id,
          email: userResponse.data.email,
          name: userResponse.data.name || null,
          avatar: userResponse.data.avatar ? `${userResponse.data.avatar}?${Date.now()}` : null,
          is_admin: userResponse.data.is_admin || false,
          bio: userResponse.data.bio || null,
          location: userResponse.data.location || null,
          phone: userResponse.data.phone || null,
          rating: userResponse.data.rating || 0
        });
      }
    } catch (error) {
      console.error('Failed to load user', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    await loadUser();
    setLoading(false);
  };

  const updateUserField = (field: keyof User, value: any) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
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
      logout,
      refreshUser, 
      updateUserField 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);