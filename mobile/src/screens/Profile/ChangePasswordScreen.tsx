import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import client from '@/api/client';

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
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    match: false,
    length: false,
    sameAsCurrent: false
  });

  const validate = () => {
    const newErrors = {
      match: newPassword !== confirmPassword,
      length: newPassword.length < 8,
      sameAsCurrent: newPassword === currentPassword && currentPassword !== ''
    };
    setErrors(newErrors);
    return !newErrors.match && !newErrors.length && !newErrors.sameAsCurrent;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);
      await client.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      Alert.alert('Success', 'Password changed successfully');
      // Clear form after successful change
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({
        match: false,
        length: false,
        sameAsCurrent: false
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
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
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password (min 8 characters)"
        secureTextEntry
        onBlur={validate}
      />

      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm New Password"
        secureTextEntry
        onBlur={validate}
      />

      {errors.match && <Text style={styles.errorText}>New passwords don't match</Text>}
      {errors.length && <Text style={styles.errorText}>Password must be at least 8 characters</Text>}
      {errors.sameAsCurrent && <Text style={styles.errorText}>New password must be different from current password</Text>}

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
        disabled={isLoading || errors.match || errors.length || errors.sameAsCurrent}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Change Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};