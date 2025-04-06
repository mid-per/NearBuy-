import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { API } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await API.post('/auth/login', { email, password });
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button 
        title="Register" 
        onPress={() => navigation.navigate('Register')} 
      />
    </View>
  );
}