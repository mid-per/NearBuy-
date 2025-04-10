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
    marginBottom: 15,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 5,
  },
});

export default function ListingDetailsScreen() {
  const navigation = useNavigation<ListingDetailsScreenProp>();
  const route = useRoute();
  const { listingId } = route.params as { listingId: number };
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await client.get(`/listings/${listingId}`);
        setListing(response.data);
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        if (isAxiosError(err)) {
          setError(err.response?.data?.error || 'Failed to load listing');
        } else {
          setError('Failed to load listing');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const handleContactSeller = () => {
    if (listing) {
      navigation.navigate('Chat', { 
        sellerId: listing.seller_id,
        listingId: listing.id 
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{error || 'Listing not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#007AFF', marginTop: 10 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Image
        source={{
          uri: listing.image_url 
            ? listing.image_url.startsWith('http') 
              ? listing.image_url // Use as-is if already full URL
              : `${BACKEND_BASE_URL}${listing.image_url}` // Construct full URL
            : 'https://via.placeholder.com/300'
        }}
        style={styles.image}
        onError={(e) => console.log('Failed to load image: (listingDetailScreen)', e.nativeEvent.error)}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
        <Text style={styles.category}>{listing.category}</Text>
        <Text style={styles.description}>{listing.description || 'No description provided'}</Text>

        <TouchableOpacity style={styles.button} onPress={handleContactSeller}>
          <Text style={styles.buttonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}