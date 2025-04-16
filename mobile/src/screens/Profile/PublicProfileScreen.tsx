import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import client from '@/api/client';
import { MaterialIcons } from '@expo/vector-icons';
import { BACKEND_BASE_URL } from '@/config';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.8;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  viewListingsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  viewListingsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});

type PublicProfileScreenProp = NativeStackNavigationProp<RootStackParamList, 'PublicProfile'>;

export default function PublicProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<PublicProfileScreenProp>();
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

  const handleClose = () => {
    navigation.goBack();
  };

const handleViewListings = () => {
  navigation.navigate('SellerListings', { 
    sellerId: userId,
    sellerName: profile.name || profile.email.split('@')[0] 
  });
};

  if (loading) {
    return (
      <Modal transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" />
          </View>
        </View>
      </Modal>
    );
  }

  if (!profile) {
    return (
      <Modal transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text>Profile not found</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <ScrollView  
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
                  {profile.phone && profile.phone.trim() !== '' && (
                    <View style={styles.phoneRow}>
                      <MaterialIcons name="phone" size={16} color="#666" />
                      <Text style={styles.phoneText}>{profile.phone}</Text>
                    </View>
                  )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewListingsButton}
              onPress={handleViewListings}
            >
              <Text style={styles.viewListingsButtonText}>View All Listings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}