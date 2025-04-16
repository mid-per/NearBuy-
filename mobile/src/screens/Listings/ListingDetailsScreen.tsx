// src/screens/Listings/ListingDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Alert
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  qrButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  soldButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 2,
  },
  viewProfileText: {
    fontSize: 14,
    color: '#007AFF',
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
    email: ''
  });

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
              email: sellerResponse.data.email
            });
          } catch (sellerError) {
            console.log('Using fallback seller info');
            setSellerInfo({
              name: `User ${listingResponse.data.seller_id}`,
              avatar: '',
              email: ''
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

  const handleViewSellerProfile = () => {
    if (listing) {
      navigation.navigate('PublicProfile', { 
        userId: listing.seller_id 
      });
    }
  };

  const isOwner = user && listing && user.id === listing.seller_id;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ marginBottom: 10 }}>{error || 'Listing not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#007AFF' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
        <Text style={styles.category}>Category: {listing.category}</Text>
        <Text style={styles.description}>{listing.description || 'No description provided'}</Text>
        
        {/* Seller Info Section */}
        <TouchableOpacity 
          style={styles.sellerContainer}
          onPress={handleViewSellerProfile}
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
  );
}