import React, {  useCallback , useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import socket from '@/utils/socket';
import { RootStackParamList } from '@/types/navigation';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    padding: 8,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
});

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenRouteProp>();
  const { roomId, sellerId, buyerId, listingId, listingTitle } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [partner, setPartner] = useState({
    name: '',
    avatar: '',
  });

  // Fixed: Added proper error handling for partner info
  const fetchPartnerInfo = useCallback(async () => {
    try {
      const partnerId = user?.id === sellerId ? buyerId : sellerId;
      const response = await client.get(`/users/${partnerId}`);
      setPartner({
        name: response.data.name || `User ${partnerId}`,
        avatar: response.data.avatar || '',
      });
    } catch (error) {
      console.log('Using default partner info');
      setPartner({
        name: `User ${user?.id === sellerId ? buyerId : sellerId}`,
        avatar: '',
      });
    }
  }, [user?.id, sellerId, buyerId]);

  // Fixed: Combined data loading with proper error handling
  const loadInitialData = useCallback(async () => {
    try {
      const [messagesResponse] = await Promise.all([
        client.get(`/chats/${roomId}/messages`),
        fetchPartnerInfo()
      ]);
      
      setMessages(messagesResponse.data.messages.map((msg: any) => ({
        ...msg,
        // Fixed: Ensure unique key by combining timestamp and id
        uniqueKey: `${msg.id}-${new Date(msg.sent_at).getTime()}`
      })));
    } catch (error) {
      console.error('Failed to load chat data:', error);
      setError('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, fetchPartnerInfo]);

  useEffect(() => {
    if (!user || !roomId) return;

    loadInitialData();

    // Socket setup
    socket.emit('join', { room_id: roomId });
    
    const handleNewMessage = (msg: any) => {
      setMessages(prev => [...prev, {
        ...msg,
        // Fixed: Ensure unique key for new messages
        uniqueKey: `${msg.id}-${new Date(msg.timestamp).getTime()}`
      }]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave', { room_id: roomId });
    };
  }, [roomId, user?.id, loadInitialData]);

  // Update header title
  useEffect(() => {
    navigation.setOptions({
      title: partner.name || listingTitle || 'Chat',
    });
  }, [partner.name, listingTitle]);

   // Fixed: Optimistic updates with proper keys
  const handleSendMessage = async () => {
    if (!message.trim() || !user || !roomId) return;

    const tempId = Date.now().toString();
    const tempKey = `${tempId}-${Date.now()}`;
    
    try {
      const newMessage = {
        id: tempId,
        content: message,
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        uniqueKey: tempKey
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      socket.emit('send_message', {
        room_id: roomId,
        user_id: user.id,
        content: message
      });

      const response = await client.post(`/chats/${roomId}/messages`, {
        content: message,
      });

      setMessages(prev => prev.map(msg => 
        msg.uniqueKey === tempKey ? { 
          ...msg, 
          id: response.data.id,
          uniqueKey: `${response.data.id}-${new Date(msg.sent_at).getTime()}`
        } : msg
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(msg => msg.uniqueKey !== tempKey));
    }
  };

   // Update header title
  useEffect(() => {
    navigation.setOptions({
      title: partner.name || listingTitle || 'Chat',
    });
  }, [partner.name, listingTitle]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.uniqueKey}  // Fixed: Using uniqueKey
        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginVertical: 4,
            alignSelf: item.sender_id === user?.id ? 'flex-end' : 'flex-start',
          }}>
            {item.sender_id !== user?.id && partner.avatar && (
              <Image 
                source={{ uri: partner.avatar }} 
                style={styles.avatar} 
              />
            )}
            <View style={[
              styles.messageBubble,
              item.sender_id === user?.id 
                ? styles.currentUserMessage 
                : styles.otherUserMessage
            ]}>
              <Text style={[
                styles.messageText,
                item.sender_id === user?.id 
                  ? styles.currentUserText 
                  : styles.otherUserText
              ]}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSendMessage}
          enablesReturnKeyAutomatically
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <MaterialIcons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}