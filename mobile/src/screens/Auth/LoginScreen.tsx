import React, { useState } from 'react';
import { 
  Alert, 
  View, 
  TextInput, 
  Button, 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { useUser } from '@/contexts/UserContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  button: {
    marginVertical: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: 'orange',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    padding: 12,
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('user1@example.com');
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser } = useUser();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
  
    setIsLoading(true);
    try {
      // Clear any existing token first
      await AsyncStorage.removeItem('access_token');
      delete client.defaults.headers.common['Authorization'];
  
      const response = await client.post('/login', { email, password });
      console.log('Login response for:', email, 'Data:', response.data);
  
      if (response.data.user_id && response.data.access_token) {
        // Verify the token matches the logged-in user
        if (response.data.email !== email) {
          throw new Error('Server returned mismatched user data');
        }
  
        await AsyncStorage.setItem('access_token', response.data.access_token);
        client.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        setUser({
          id: response.data.user_id,
          email: response.data.email,
          isAdmin: response.data.is_admin || false
        });
  
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Full login error:', error);
      await AsyncStorage.removeItem('access_token');
      delete client.defaults.headers.common['Authorization'];
      
      let errorMessage = 'Login failed';
      
      if (isAxiosError(error)) {
        // TypeScript now knows error is AxiosError
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        // TypeScript now knows error is Error
        errorMessage = error.message;
      }
  
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await client.get('/healthcheck');
      Alert.alert('Success', `Backend connected!\nStatus: ${response.status}`);
    } catch (error) {
      let errorMessage = 'Connection failed';
      if (isAxiosError(error)) {
        errorMessage += ` (Status: ${error.response?.status || 'No response'})`;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button
          title="Login"
          onPress={handleLogin}
          color="#007AFF"
        />
      )}

      <TouchableOpacity 
        style={[styles.button, styles.registerButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>REGISTER NOW</Text>
      </TouchableOpacity>

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
  );
}