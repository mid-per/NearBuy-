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
  const [email, setEmail] = useState('test@example.com');
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
      const response = await client.post('/login', { 
        email, 
        password 
      });
      
      await AsyncStorage.setItem('access_token', response.data.access_token);
      navigation.navigate('Home');
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
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