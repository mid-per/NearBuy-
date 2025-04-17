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
  ScrollView,
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
const ITEM_WIDTH = (width - 60) / 2; // Adjusted spacing

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  gridContainer: {
    paddingHorizontal: 5,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: ITEM_WIDTH,
    resizeMode: 'cover',
    backgroundColor: '#f5f5f5',
  },
  itemDetails: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  soldText: {
    color: '#FF3B30',
    textDecorationLine: 'line-through'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
    marginLeft: 5,
  },
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
    
    if (route.params?.refreshTimestamp) {
      fetchListings();
    }
  }, [route.params?.refreshTimestamp]);

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
        item.status === 'sold' && { opacity: 0.7 }
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
            item.status === 'sold' && styles.soldText
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[
          styles.itemPrice,
          item.status === 'sold' && styles.soldText
        ]}>
          {item.status === 'sold' ? 'SOLD' : `$${item.price.toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity onPress={fetchListings}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons 
            name="search" 
            size={20} 
            color="#666" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Categories Filter */}
        <Text style={styles.sectionTitle}>Categories</Text>
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

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No listings match your search' 
                : 'No listings available right now'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridContainer}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </ScrollView>
    </View>
  );
}