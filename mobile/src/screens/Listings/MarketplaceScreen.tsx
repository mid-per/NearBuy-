// src/screens/Listings/MarketplaceScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
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
import { RouteProp } from '@react-navigation/native';

type MarketplaceScreenProp = NativeStackNavigationProp<RootStackParamList,'Marketplace'>;
type MarketplaceRouteProp = RouteProp<RootStackParamList, 'Marketplace'>;

interface Listing {
    id: number;
    title: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    seller_id: number;
    status: string;
    created_at: string;
    updated_at: string;
  }

interface MarketplaceScreenProps {
  route: MarketplaceRouteProp;
}
  
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 40) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  soldText: {
    color: 'red',
    textDecorationLine: 'line-through'
  },
  soldPrice: {
    color: 'red',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: 'gray',
    opacity: 0.7
  }
});

const CATEGORIES = [
  'All',
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Vehicles',
  'Other',
];

export default function MarketplaceScreen({ route }: MarketplaceScreenProps) {
  const navigation = useNavigation<MarketplaceScreenProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');

  const fetchListings = async () => {
    try {
      const params: Record<string, string> = { status: 'active' };
      
      if (searchQuery) {
        params.q = searchQuery;
      }
      
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      
      const response = await client.get('/listings/search', { params });
      setListings(response.data.results);
      setError('');
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      if (isAxiosError(err)) {
        setError(err.response?.status === 404
          ? 'No listings found'
          : err.response?.data?.error || 'Failed to load listings'
        );
      } else {
        setError('Failed to load listings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchListings();
    
    // Add this to handle refresh from CreateListingScreen
    if (route.params?.refreshTimestamp) {
      fetchListings();
    }
  }, [searchQuery, selectedCategory, route.params?.refreshTimestamp]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleListingPress = (listing: Listing) => {
    navigation.navigate('ListingDetails', { listingId: listing.id });
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        item.status === 'sold' && { opacity: 0.6 }
      ]}
      onPress={() => handleListingPress(item)}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/300' }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text 
          style={[
            styles.itemTitle, 
            item.status === 'sold' && { color: 'red', textDecorationLine: 'line-through' }
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>
          {item.status === 'sold' ? 'SOLD' : `$${item.price.toFixed(2)}`}
        </Text>
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
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filterContainer}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.activeFilter,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === category && styles.activeFilterText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No listings found. {searchQuery ? 'Try a different search.' : ''}
          </Text>
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