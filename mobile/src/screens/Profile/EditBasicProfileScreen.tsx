import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { BACKEND_BASE_URL } from '@/config';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
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
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function EditBasicProfileScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    avatar: user?.avatar || undefined
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      if (!user) throw new Error('User not authenticated');

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bio', form.bio);
      formData.append('location', form.location);
      formData.append('phone', form.phone);

      if (form.avatar && form.avatar.startsWith('file:')) {
        const fileExt = form.avatar.split('.').pop()?.toLowerCase() || 'jpg';
        formData.append('avatar', {
          uri: form.avatar,
          name: `avatar_${user.id}.${fileExt}`,
          type: `image/${fileExt}`
        } as any);
      } else if (form.avatar === null) {
        formData.append('avatar', '');
      }

      const { data } = await client.put(`/users/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUser({ ...user, ...data });
      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setForm({...form, avatar: result.assets[0].uri});
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Profile Picture</Text>
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

      <Text style={styles.sectionHeader}>Basic Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.name}
        onChangeText={(text) => setForm({...form, name: text})}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="About you"
        value={form.bio}
        onChangeText={(text) => setForm({...form, bio: text})}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={form.location}
        onChangeText={(text) => setForm({...form, location: text})}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={form.phone}
        onChangeText={(text) => setForm({...form, phone: text})}
        keyboardType="phone-pad"
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleUpdate}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity> 
    </ScrollView>
  );
}