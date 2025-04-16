import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import client from '@/api/client';
import { MaterialIcons } from '@expo/vector-icons';
import { BACKEND_BASE_URL } from '@/config';
import { RootStackParamList } from '@/types/navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
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
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
  bioText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  detailsContainer: {
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});

export default function PublicProfileScreen() {
  const route = useRoute();
  const { userId } = route.params as { userId: number };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadProfile = async () => {
    try {
      const response = await client.get(`/users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView  
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image 
              source={{ uri: `${BACKEND_BASE_URL}${profile.avatar}` }} 
              style={styles.avatar}
            />
          ) : (
            <MaterialIcons name="person" size={50} color="#666" />
          )}
        </View>
        
        <Text style={styles.name}>
          {profile.name || profile.email?.split('@')[0] || 'User'}
        </Text>
        
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={20} color="#FFD700" />
          <Text style={styles.ratingText}>
            {profile.rating?.toFixed(1) || '0.0'} ({profile.listings_count || 0} listings)
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        {profile.bio && profile.bio.trim() !== '' && (
          <Text style={styles.bioText}>{profile.bio}</Text>
        )}
        
        <View style={styles.detailsContainer}>
          {profile.location && profile.location.trim() !== '' && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={16} color="#666" />
              <Text style={styles.detailText}>{profile.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listings</Text>
        <Text>This user has {profile.listings_count || 0} active listings</Text>
      </View>
    </ScrollView>
  );
}