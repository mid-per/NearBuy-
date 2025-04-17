import React, { useState } from 'react';
import { 
  Alert, 
  View, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { useUser } from '@/contexts/UserContext';
import { MaterialIcons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('user1@example.com');
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);

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
          name: null, // or get from response if available
          avatar: null, // or get from response if available
          is_admin: false,
          bio: null,
          location: null,
          phone: null
        });
  
        navigation.navigate('Main');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.iconInput}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <View style={styles.iconInput}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { flex: 1 }]}
            />
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footerText}>Don't have an account yet?</Text>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>CREATE NEW ACCOUNT</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}