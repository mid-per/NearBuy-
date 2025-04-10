// src/screens/Inbox/InboxScreen.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '@/contexts/UserContext';
import client from '@/api/client';

type InboxScreenProp = NativeStackNavigationProp<RootStackParamList, 'Inbox'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default function InboxScreen() {
  const navigation = useNavigation<InboxScreenProp>();
  const { user } = useUser();
  const [chats, setChats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      
      try {
        const response = await client.get('/chats');
        setChats(response.data.chats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', {
              roomId: item.id,
              sellerId: item.seller_id,
              listingId: item.listing_id
            })}
          >
            <Text style={styles.chatTitle}>{item.listing_title}</Text>
            <Text>Last message: {item.last_message || 'No messages yet'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active chats yet</Text>
        }
      />
    </View>
  );
}