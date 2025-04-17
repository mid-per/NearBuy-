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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { BACKEND_BASE_URL } from '@/config';
import { RootStackParamList } from '@/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileScreenProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  bioContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenProp>();
  const { user, refreshUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    rating: 0,
    listingsCount: 0
  });
  
  const loadProfile = async () => {
    try {
      await refreshUser(); // This will update the user context
      if (user?.id) {
        const response = await client.get(`/users/${user.id}`);
        setStats({
          rating: response.data.rating || 0,
          listingsCount: response.data.listings_count || 0
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUser();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
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
  
      if (!result.canceled && result.assets[0].uri && user) {
        setIsLoading(true);
        
        // Read the file as base64
        const fileData = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Prepare the image data for upload
        const imageData = {
          image: `data:image/jpeg;base64,${fileData}`,
          filename: `avatar_${user.id}_${Date.now()}.jpg`
        };

        // Upload the image
        const uploadResponse = await client.post('/upload', imageData);
        
        // Update user profile with new avatar
        await client.put(`/users/${user.id}`, {
          avatar: uploadResponse.data.url.replace(BACKEND_BASE_URL, '')
        });
  
        // Refresh user data
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Avatar update error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || 'Failed to update profile picture'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear token from storage
      await AsyncStorage.removeItem('access_token');
      // Clear axios auth header
      delete client.defaults.headers.common['Authorization'];
      // Navigate to login
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
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image 
              source={{ 
                uri: `${BACKEND_BASE_URL}${user.avatar}?${Date.now()}`,
                cache: 'reload'
              }} 
              style={styles.avatar}
            />
          ) : (
            <MaterialIcons name="person" size={50} color="#666" />
          )}
        </TouchableOpacity>
        
        <Text style={styles.name}>
          {user?.name || user?.email?.split('@')[0] || 'User'}
        </Text>
        
        <Text style={styles.email}>{user?.email}</Text>
        
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.listingsCount}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>
      </View>

      {/* Bio Section */}
      {user?.bio && user.bio.trim() !== '' && (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.section}>
        {(user?.location || user?.phone) && (
          <Text style={styles.sectionTitle}>Contact Information</Text>
        )}
        
        {user?.location && user.location.trim() !== '' && (
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={18} color="#007AFF" />
            <Text style={styles.detailText}>{user.location}</Text>
          </View>
        )}
        
        {user?.phone && user.phone.trim() !== '' && (
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={18} color="#007AFF" />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
        )}
      </View>

      {/* My Listings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Listings</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            if (user?.id) {
              navigation.navigate('SellerListings', {
                sellerId: user.id,
                sellerName: user.name || user.email?.split('@')[0],
              });
            }
          }}
        >
          <Text style={styles.buttonText}>View My Listings</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('EditBasicProfile')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ChangeEmail')}
        >
          <Text style={styles.secondaryButtonText}>Change Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text style={styles.secondaryButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}