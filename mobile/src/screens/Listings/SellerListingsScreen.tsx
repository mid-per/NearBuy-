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
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { Listing } from '@/types/listing';
import { useUser } from '@/contexts/UserContext';
import { useLayoutEffect } from 'react';

type SellerListingsScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'SellerListings'
>;

interface SellerListingsScreenProps {
  route: {
    params: {
      sellerId: number;
      sellerName?: string;
    };
  };
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // Adjusted spacing

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
  soldPrice: {
    color: '#FF3B30',
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
  soldIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 1,
  },
  soldIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sectionHeader: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 10,
  },
  sectionHeaderText: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  },
});

export default function SellerListingsScreen() {
  const navigation = useNavigation<SellerListingsScreenProp>();
  const route = useRoute();
  const { sellerId, sellerName } = route.params as { 
    sellerId: number; 
    sellerName?: string 
  };
  const { user } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: sellerName ? `${sellerName}'s Listings` : 'Listings',
      headerBackTitle: 'Back',
    });
  }, [navigation, sellerName]);
  
  const fetchListings = async () => {
    try {
      const params: any = { 
        seller_id: sellerId,
      };
  
      if (!user || user.id !== sellerId) {
        params.status = 'active';
      }
  
      const response = await client.get('/listings/search', { params });
      
      // Sort listings - active first, then sold (only for own listings)
      const sortedListings = user?.id === sellerId 
        ? [...response.data.results].sort((a, b) => {
            if (a.status === 'sold' && b.status !== 'sold') return 1;
            if (a.status !== 'sold' && b.status === 'sold') return -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
        : response.data.results;
      
      setListings(sortedListings);
      setError('');
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      if (isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to load listings');
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
  }, [sellerId]);

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
      {item.status === 'sold' && (
        <View style={styles.soldIndicator}>
          <Text style={styles.soldIndicatorText}>SOLD</Text>
        </View>
      )}
      <Image
        source={{
          uri: item.image_url || 'https://via.placeholder.com/300'
        }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text 
          style={[
            styles.itemTitle,
            item.status === 'sold' && { color: '#888' }
          ]} 
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[
          styles.itemPrice,
          item.status === 'sold' && styles.soldPrice
        ]}>
          {item.status === 'sold' ? 'SOLD' : `$${item.price.toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
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
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {sellerName 
                ? `${sellerName} hasn't listed any items yet` 
                : 'No listings found'}
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
            contentContainerStyle={{ paddingTop: 10 }}
          />
        )}
      </ScrollView>
    </View>
  );
}