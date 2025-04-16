import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { useUser } from '@/contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { setUser } = useUser(); // Moved to top level

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await client.post('/register', { 
        email, 
        password 
      });
  
      if (response.status === 201) {
        // Automatically log in after registration
        const loginResponse = await client.post('/login', { email, password });
        await AsyncStorage.setItem('access_token', loginResponse.data.access_token);
        
        // Set authorization header for future requests
        client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.access_token}`;
        
        // Update user context
        setUser({
          id: loginResponse.data.user_id,
          email: email,
          name: null, // or get from response if available
          avatar: null, // or get from response if available
          is_admin: false,
          bio: null,
          location: null,
          phone: null
        });
        
        // Navigate after all state is updated
        navigation.navigate('Login');
      }
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <View style={styles.button}>
          <Button
            title="Register"
            onPress={handleRegister}
            color="#007AFF"
          />
        </View>
      )}

      <Text style={styles.loginText}>
        Already have an account?{' '}
        <TouchableOpacity onPress={navigateToLogin}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
}