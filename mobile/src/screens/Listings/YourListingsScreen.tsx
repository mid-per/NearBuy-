// src/screens/Listings/YourListingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { Listing } from '@/types/listing';
import { useUser } from '@/contexts/UserContext';

type YourListingsScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'YourListings'
>;

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 40) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  gridContainer: {
    paddingHorizontal: 5,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 5,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemImage: {
    width: '100%',
    height: ITEM_WIDTH,
    resizeMode: 'cover',
  },
  itemDetails: {
    padding: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function YourListingsScreen() {
  const navigation = useNavigation<YourListingsScreenProp>();
  const { user } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    if (!user?.id) return;
    
    try {
      const response = await client.get('/listings/search', {
        params: { 
          seller_id: user.id,
          status: 'active' // Ensure we only get active listings
        }
      });
      setListings(response.data.results);
      setError('');
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      if (isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to load your listings');
      } else {
        setError('Failed to load your listings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleListingPress = (listing: Listing) => {
    navigation.navigate('ListingDetails', { listingId: listing.id });
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleListingPress(item)}
    >
      <Image
        source={{
          uri: item.image_url || 'https://via.placeholder.com/300'
        }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity onPress={fetchListings}>
          <Text style={[styles.emptyText, { color: '#007AFF' }]}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Listings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateListing')}>
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't created any listings yet.
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>
              Create your first listing
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}