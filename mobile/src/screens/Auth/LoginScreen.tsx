import React, { useState } from 'react';
import { Alert, View, TextInput, Button, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  button: {
    height: 50,
    marginBottom: 10,
    justifyContent: 'center',
    borderRadius: 5,
  },
  registerButton: {
    backgroundColor: 'orange',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    /* existing login logic */
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        title="Login"
        onPress={handleLogin}
        color="blue"
      />

      {/* THIS IS THE REGISTER BUTTON - BRIGHT ORANGE AND IMPOSSIBLE TO MISS */}
      <TouchableOpacity 
        style={[styles.button, styles.registerButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>REGISTER NOW</Text>
      </TouchableOpacity>

      <Button
        title="Test Connection"
        onPress={() => {}}
        color="gray"
      />
    </View>
  );
}