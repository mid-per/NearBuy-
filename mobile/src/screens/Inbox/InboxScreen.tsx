import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '@/contexts/UserContext';
import client from '@/api/client';
import { MaterialIcons } from '@expo/vector-icons';
import { BACKEND_BASE_URL } from '@/config';

type InboxScreenProp = NativeStackNavigationProp<RootStackParamList, 'Inbox'>;

interface ChatItem {
  id: number;
  seller_id: number;
  buyer_id: number;
  listing_id: number;
  listing_title: string;
  status: 'active' | 'sold';
  last_message?: string;
  last_message_time?: string;
  seller_avatar?: string;
  buyer_avatar?: string;
  seller_name?: string;
  buyer_name?: string;
  unread_count?: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatList: {
    paddingHorizontal: 15,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  soldChatItem: {
    opacity: 0.6,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  soldText: {
    color: '#FF3B30',
    textDecorationLine: 'line-through'
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
  },
  soldPreview: {
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  soldBadge: {
    backgroundColor: '#FF3B30',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function InboxScreen() {
  const navigation = useNavigation<InboxScreenProp>();
  const { user } = useUser();
  const [chats, setChats] = React.useState<ChatItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchChats = async () => {
    if (!user) return;
    
    try {
      const response = await client.get('/chats');
      const processedChats = response.data.chats.map((chat: any) => ({
        ...chat,
        seller_avatar: chat.seller_avatar ? 
          (chat.seller_avatar.startsWith('http') ? chat.seller_avatar : `${BACKEND_BASE_URL}${chat.seller_avatar}`) 
          : undefined,
        buyer_avatar: chat.buyer_avatar ? 
          (chat.buyer_avatar.startsWith('http') ? chat.buyer_avatar : `${BACKEND_BASE_URL}${chat.buyer_avatar}`) 
          : undefined,
        last_message_time: formatTime(chat.last_message_time),
        status: chat.status || 'active',
        completed_at: chat.completed_at // Add completed_at from backend
      }));
      
      // Sort chats - active first, then sold, with newest sold at top
      const sortedChats = [...processedChats].sort((a, b) => {
        // Active listings come first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        
        // For sold listings, sort by completed_at (newest first)
        if (a.status === 'sold' && b.status === 'sold') {
          return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
        }
        
        // For active listings, sort by last message time
        return new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime();
      });
      
      setChats(sortedChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  React.useEffect(() => {
    fetchChats();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        contentContainerStyle={styles.chatList}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        renderItem={({ item }) => {
          const isSold = item.status === 'sold';
          const unreadCount = item.unread_count || 0;
          
          // Determine which user is the other party
          const isSeller = user?.id === item.seller_id;
          const otherPartyAvatar = isSeller ? item.buyer_avatar : item.seller_avatar;
          const otherPartyName = isSeller ? item.buyer_name : item.seller_name;
          
          return (
            <TouchableOpacity 
              style={[
                styles.chatItem,
                isSold && styles.soldChatItem
              ]}
              onPress={() => navigation.navigate('Chat', {
                roomId: item.id,
                sellerId: item.seller_id,
                buyerId: item.buyer_id,
                listingId: item.listing_id,
                listingTitle: item.listing_title,
                status: item.status,
                otherPartyName,
                otherPartyAvatar
              })}
            >
              <View style={styles.avatarContainer}>
                {otherPartyAvatar ? (
                  <Image 
                  source={{ 
                    uri: `${otherPartyAvatar}`,
                    cache: 'force-cache' 
                  }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <MaterialIcons name="person" size={24} color="#666" />
                )}
              </View>
              
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text 
                    style={[
                      styles.chatTitle,
                      isSold && styles.soldText
                    ]} 
                    numberOfLines={1}
                  >
                    {item.listing_title || 'Unknown Listing'}
                    {isSold && ' (Sold)'}
                  </Text>
                  <Text style={styles.chatTime}>
                    {item.last_message_time}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.chatPreview,
                    isSold && styles.soldPreview
                  ]} 
                  numberOfLines={1}
                >
                  {item.last_message || 'No messages yet'}
                </Text>
              </View>
        
              {unreadCount > 0 ? (
                <View style={[
                  styles.unreadBadge,
                  isSold && styles.soldBadge
                ]}>
                  <Text style={styles.unreadText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : isSold && (
                <MaterialIcons name="check-circle" size={20} color="#FF3B30" />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={50} color="#999" />
            <Text style={styles.emptyText}>No active chats yet</Text>
            <Text style={[styles.emptyText, { fontSize: 14, marginTop: 10 }]}>
              Start a chat from a listing to connect with sellers
            </Text>
          </View>
        }
      />
    </View>
  );
}