import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet,
  Image, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { Listing } from '@/types/listing';
import { BACKEND_BASE_URL } from '@/config';
import { useUser } from '@/contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ListingDetailsScreenProp = NativeStackNavigationProp<RootStackParamList, 'ListingDetails'>;

const { height } = Dimensions.get('window');
const PROFILE_HEIGHT = height * 0.75;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  soldPrice: {
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    paddingLeft: 5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 25,
    paddingLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  viewProfileText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  qrButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  soldButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  profileModalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  profileModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    // Remove maxHeight temporarily
    transform: [{ translateY: 0 }] // Default position
  },
  profileScrollContent: {
    flexGrow: 1, // Ensures content can scroll
  },
  profileScrollContainer: { 
    maxHeight: PROFILE_HEIGHT - 60, // Account for padding and handle
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  profileBioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  profileViewListingsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  profileViewListingsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default function ListingDetailsScreen() {
  const navigation = useNavigation<ListingDetailsScreenProp>();
  const route = useRoute();
  const { listingId } = route.params as { listingId: number };
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const [listingStatus, setListingStatus] = useState<'available' | 'sold'>('available');
  const [sellerInfo, setSellerInfo] = useState({
    name: '',
    avatar: '',
    email: '',
    bio: '',
    location: '',
    phone: ''
  });
  const [showProfile, setShowProfile] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleProfile = () => {
    if (showProfile) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowProfile(false));
    } else {
      setShowProfile(true);
      slideAnim.setValue(1);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dragThreshold = PROFILE_HEIGHT * 0.4; 
        
        if (gestureState.dy > dragThreshold) {
          Animated.timing(slideAnim, {
            toValue: PROFILE_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowProfile(false));
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;
  
  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        const listingResponse = await client.get(`/listings/${listingId}`);
        setListing(listingResponse.data);
        setListingStatus(listingResponse.data.status === 'sold' ? 'sold' : 'available');
      
        if (listingResponse.data?.seller_id) {
          try {
            const sellerResponse = await client.get(`/users/${listingResponse.data.seller_id}`);
            setSellerInfo({
              name: sellerResponse.data.name || sellerResponse.data.email.split('@')[0],
              avatar: sellerResponse.data.avatar || '',
              email: sellerResponse.data.email,
              bio: sellerResponse.data.bio || '',
              location: sellerResponse.data.location || '',
              phone: sellerResponse.data.phone || ''
            });
          } catch (sellerError) {
            console.log('Using fallback seller info');
            setSellerInfo({
              name: `User ${listingResponse.data.seller_id}`,
              avatar: '',
              email: '',
              bio: '',
              location: '',
              phone: ''
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        if (isAxiosError(err)) {
          setError(err.response?.status === 404 
            ? 'Listing not found' 
            : err.response?.data?.error || 'Failed to load listing'
          );
        } else {
          setError('Failed to load listing');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [listingId]);

  const handleContactSeller = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to contact the seller', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!listing) {
      Alert.alert('Error', 'Listing information not available');
      return;
    }

    try {
      const response = await client.post('/chats/initiate', {
        listing_id: listing?.id
      });
      
      navigation.navigate('Chat', {
        roomId: response.data.room_id,
        listingId: listing?.id,
        sellerId: listing?.seller_id,
        buyerId: user.id,
        listingTitle: listing.title || `Item ${listing.id}`
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        const { setUser } = useUser();
        await AsyncStorage.removeItem('access_token');
        setUser(null);
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 
          isAxiosError(error) 
            ? error.response?.data?.error || 'Failed to start chat'
            : 'Failed to start chat'
        );
      }
    }
  };

  const handleGenerateQR = () => {
    if (!listing) return;
    navigation.navigate('QRGenerate', { listingId: listing.id.toString() });
  };

  const renderProfilePanel = () => {
    if (!listing || !showProfile) return null;
  
    return (
      <Modal
        transparent
        visible={showProfile}
        onRequestClose={toggleProfile}
        animationType="slide"
      >
        <View style={styles.profileModalContainer}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={toggleProfile}
          />
          
          <Animated.View
            style={[
              styles.profileModalContent,
              {
                transform: [{ translateY: slideAnim }],
              }
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.profileModalHandle} />
            
            <ScrollView 
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Seller Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatarContainer}>
                  {sellerInfo.avatar ? (
                    <Image 
                      source={{ uri: `${BACKEND_BASE_URL}${sellerInfo.avatar}` }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <MaterialIcons name="person" size={40} color="#666" />
                  )}
                </View>
                
                <Text style={styles.profileName}>{sellerInfo.name}</Text>
                <Text style={styles.profileEmail}>{sellerInfo.email}</Text>
              </View>
  
              {/* Seller Information Section */}
              {(sellerInfo.bio || sellerInfo.location || sellerInfo.phone) && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>About</Text>
                  
                  {sellerInfo.bio && (
                    <Text style={styles.profileBioText}>{sellerInfo.bio}</Text>
                  )}
                  
                  {sellerInfo.location && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="location-on" size={18} color="#007AFF" />
                      <Text style={styles.detailText}>{sellerInfo.location}</Text>
                    </View>
                  )}
                  
                  {sellerInfo.phone && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="phone" size={18} color="#007AFF" />
                      <Text style={styles.detailText}>{sellerInfo.phone}</Text>
                    </View>
                  )}
                </View>
              )}
  
              {/* View Listings Button */}
              <TouchableOpacity
                style={styles.profileViewListingsButton}
                onPress={() => {
                  toggleProfile();
                  navigation.navigate('SellerListings', { 
                    sellerId: listing.seller_id,
                    sellerName: sellerInfo.name 
                  });
                }}
              >
                <Text style={styles.profileViewListingsButtonText}>
                  View All Listings
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user && listing && user.id === listing.seller_id;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Image
          source={{
            uri: listing.image_url 
              ? listing.image_url.startsWith('http') 
                ? listing.image_url
                : `${BACKEND_BASE_URL}${listing.image_url}`
              : 'https://via.placeholder.com/300'
          }}
          style={styles.image}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={[
            styles.price,
            listingStatus === 'sold' && styles.soldPrice
          ]}>
            {listingStatus === 'sold' ? 'SOLD' : `$${listing.price.toFixed(2)}`}
          </Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="category" size={18} color="#007AFF" />
            <Text style={styles.category}>{listing.category}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {listing.description || 'No description provided'}
          </Text>

          <Text style={styles.sectionTitle}>Seller</Text>
          <TouchableOpacity 
            style={styles.sellerContainer}
            onPress={() => setShowProfile(true)}
          >
            <View style={styles.sellerAvatar}>
              {sellerInfo.avatar ? (
                <Image 
                  source={{ uri: `${BACKEND_BASE_URL}${sellerInfo.avatar}` }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <MaterialIcons name="person" size={24} color="#666" />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{sellerInfo.name}</Text>
              <Text style={styles.viewProfileText}>View Profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {listingStatus === 'sold' ? (
            <TouchableOpacity 
              style={styles.soldButton}
              disabled
            >
              <Text style={styles.buttonText}>SOLD</Text>
            </TouchableOpacity>
          ) : isOwner ? (
            <TouchableOpacity 
              style={styles.qrButton} 
              onPress={handleGenerateQR}
            >
              <Text style={styles.buttonText}>Generate QR Code</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContactSeller}
            >
              <Text style={styles.buttonText}>Contact Seller</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {renderProfilePanel()}
    </View>
  );
}