// src/screens/Profile/PurchaseHistoryScreen.tsx
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
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

type PurchaseHistoryScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'PurchaseHistory'
>;

interface TransactionItem {
  id: number;
  listing_id: number;
  title: string;
  price: number;
  image_url?: string;
  completed_at?: string;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  }
});

export default function PurchaseHistoryScreen() {
  const navigation = useNavigation<PurchaseHistoryScreenProp>();
  const { user } = useUser();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPurchaseHistory = async () => {
    try {
      const response = await client.get('/transactions/history');
      // Map the response to our TransactionItem interface
      const completedTransactions = response.data.bought
        .filter((t: any) => t.completed)
        .map((t: any) => ({
          id: t.id,
          listing_id: t.listing_id,
          title: t.title,
          price: t.price,
          image_url: t.image_url,
          completed_at: t.completed_at
        }));
      setTransactions(completedTransactions);
      setError('');
    } catch (err) {
      console.error('Failed to fetch purchase history:', err);
      setError('Failed to load purchase history');
      if (isAxiosError(err) && err.response?.status === 401) {
        setError('Please login to view purchase history');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchaseHistory();
  };

  const handleItemPress = (listingId: number) => {
    navigation.navigate('ListingDetails', { listingId });
  };

  const renderItem = ({ item }: { item: TransactionItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleItemPress(item.listing_id)}
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
        <Text style={styles.itemPrice}>
          ${item.price.toFixed(2)}
        </Text>
        {item.completed_at && (
          <Text style={styles.transactionDate}>
            Purchased on {new Date(item.completed_at).toLocaleDateString()}
          </Text>
        )}
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
        <TouchableOpacity onPress={fetchPurchaseHistory}>
          <Text style={[styles.emptyText, { color: '#007AFF' }]}>Tap to retry</Text>
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
        <View style={styles.header}>
          <Text style={styles.headerText}>Your Purchase History</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't purchased any items yet</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
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