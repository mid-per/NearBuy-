import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    try {
      const response = await client.post('/login', { email, password });
      navigation.navigate('Home');
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 10, padding: 10, borderWidth: 1 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 10, padding: 10, borderWidth: 1 }}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}