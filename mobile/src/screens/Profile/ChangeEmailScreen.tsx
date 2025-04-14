import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function ChangeEmailScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (!currentPassword || !newEmail) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }

      if (newEmail === user?.email) {
        Alert.alert('Error', 'New email must be different');
        return;
      }

      await client.post('/auth/change-email', {
        currentPassword,
        newEmail
      });
      
      setUser({ ...user, email: newEmail });
      Alert.alert('Success', 'Email updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error', 
        error.response?.data?.error || 'Failed to change email'
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Current Password"
        secureTextEntry
      />
      
      <TextInput
        style={styles.input}
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder="New Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Change Email</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};