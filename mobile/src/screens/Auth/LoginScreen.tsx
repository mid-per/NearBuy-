import React, { useState } from 'react';
import { Alert, View, TextInput, Button, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen() {
  const [email, setEmail] = useState('test@example.com'); // Pre-filled for testing
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/login', { email, password });
      await AsyncStorage.setItem('access_token', response.data.access_token);
      navigation.navigate('Home');
      console.log('Login successful! Token:', response.data.access_token);
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('Login error:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await client.get('/healthcheck');
      Alert.alert('Success', `Backend connected!\n${res.data.message}`);
    } catch (error) {
      let errorMessage = 'Connection failed';
      if (isAxiosError(error)) {
        errorMessage += `: ${error.message}`;
        if (error.response) {
          errorMessage += ` (Status: ${error.response.status})`;
        }
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 10, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginVertical: 10 }} />
      ) : (
        <Button 
          title="Login" 
          onPress={handleLogin} 
          disabled={isLoading}
        />
      )}

      <View style={{ marginTop: 20 }}>
        {isTestingConnection ? (
          <ActivityIndicator size="small" />
        ) : (
          <Button
            title="Test Backend Connection"
            onPress={testConnection}
            color="#666"
          />
        )}
      </View>
    </View>
  );
}