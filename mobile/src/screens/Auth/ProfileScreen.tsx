// ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileScreenProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenProp>();
  const { user, logout } = useUser();
  const [profile, setProfile] = useState({
    name: '',
    avatar: '',
    rating: 0,
    listingsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await client.get(`/users/${user?.id}`);
        
        setProfile({
          name: response.data.name || user?.email.split('@')[0] || 'User',
          avatar: response.data.avatar || '',
          rating: response.data.rating || 0,
          listingsCount: response.data.listings_count || 0,
        });
        
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to basic data if API fails
        setProfile({
          name: user?.email.split('@')[0] || 'User',
          avatar: '',
          rating: 0,
          listingsCount: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await client.get(`/users/${user?.id}`);
      setProfile({
        name: response.data.name || user?.email.split('@')[0] || 'User',
        avatar: response.data.avatar || '',
        rating: response.data.rating || 0,
        listingsCount: response.data.listings_count || 0,
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      try {
        setIsLoading(true);
        // Upload the image similar to CreateListingScreen
        const uploadResponse = await client.post('/upload', {
          image: result.assets[0].uri,
        });
        
        // Update profile with new avatar
        await client.patch(`/users/${user?.id}/profile`, {
          avatar: uploadResponse.data.url,
        });
        
        setProfile(prev => ({ ...prev, avatar: uploadResponse.data.url }));
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Use the logout function from UserContext
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView  
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="person" size={50} color="#666" />
          )}
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>
              {profile.rating.toFixed(1)} ({profile.listingsCount} listings)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Listings</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('YourListings')}
        >
          <Text style={styles.buttonText}>View My Listings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}