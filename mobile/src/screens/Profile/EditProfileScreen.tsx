import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { BACKEND_BASE_URL } from '@/config';
import { EditProfileForm } from '@/types/user';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
    color: 'white',
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
  deleteButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function EditProfileScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation();
  const [form, setForm] = useState<EditProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    avatar: user?.avatar || undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      if (!user) throw new Error('User not authenticated');

      // Prepare update data
      const updateData = new FormData();
      updateData.append('name', form.name);
      updateData.append('email', form.email);

      // Only include password if it's not empty
      if (form.password.trim()) {
        updateData.append('password', form.password);
      }

      // Handle avatar upload if changed
      if (form.avatar && form.avatar.startsWith('file:')) {
        console.log('Processing avatar upload...'); 
        setIsUploading(true);
        const fileInfo = await FileSystem.getInfoAsync(form.avatar);
        const fileExt = form.avatar.split('.').pop()?.toLowerCase() || 'jpg';
        
        updateData.append('avatar', {
          uri: form.avatar,
          name: `avatar_${user.id}.${fileExt}`,
          type: `image/${fileExt}`
        } as any);
        console.log('FormData contents:');
      } else if (form.avatar === null) {
        updateData.append('avatar', ''); // To remove avatar
      }

      // Send update request
      const { data } = await client.put(`/users/${user.id}`, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user context
      setUser({ 
        ...user, 
        name: data.name,
        email: data.email,
        avatar: data.avatar 
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setForm({...form, avatar: result.assets[0].uri});
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeAvatar = () => {
    setForm({...form, avatar: undefined});
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {form.avatar ? (
          <Image
            source={{ uri: form.avatar.startsWith('file:') ? form.avatar : `${BACKEND_BASE_URL}${form.avatar}` }}
            style={styles.avatar}
          />
        ) : (
          <MaterialIcons name="person" size={60} color="#ccc" />
        )}
        <MaterialIcons name="edit" size={24} style={styles.editIcon} />
      </TouchableOpacity>

      {form.avatar && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#ff4444', marginBottom: 15 }]}
          onPress={removeAvatar}
        >
          <Text style={styles.buttonText}>Remove Photo</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={form.name}
        onChangeText={(text) => setForm({...form, name: text})}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => setForm({...form, email: text})}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="New Password (leave blank to keep current)"
        value={form.password}
        onChangeText={(text) => setForm({...form, password: text})}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleUpdate}
        disabled={isLoading || isUploading}
      >
        {(isLoading || isUploading) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}