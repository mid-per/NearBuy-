import React, { useCallback, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
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
import { BACKEND_BASE_URL } from '@/config';

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
  readReceipt: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    marginRight: 8,
    textAlign: 'right',
  },
  messageGroup: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  currentUserGroup: {
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenRouteProp>();
  const { roomId, sellerId, buyerId, listingId, listingTitle, otherPartyName, otherPartyAvatar } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Initialize partner info from route params if available
  const [partner, setPartner] = useState({
    name: otherPartyName || '',
    avatar: otherPartyAvatar || '',
  });

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
        name: otherPartyName || `User ${user?.id === sellerId ? buyerId : sellerId}`,
        avatar: otherPartyAvatar || '',
      });
    }
  }, [user?.id, sellerId, buyerId, otherPartyName, otherPartyAvatar]);

  const loadInitialData = useCallback(async () => {
    try {
      const [messagesResponse] = await Promise.all([
        client.get(`/chats/${roomId}/messages`),
        fetchPartnerInfo()
      ]);
      
      setMessages(messagesResponse.data.messages.map((msg: any) => ({
        ...msg,
        uniqueKey: `${msg.id}-${new Date(msg.sent_at).getTime()}`,
        is_read: msg.read_at !== null
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
        uniqueKey: `${msg.id}-${new Date(msg.timestamp).getTime()}`,
        is_read: msg.sender_id === user.id // Messages from current user are always "read"
      }]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave', { room_id: roomId });
    };
  }, [roomId, user?.id, loadInitialData]);

  useEffect(() => {
    navigation.setOptions({
      title: partner.name || listingTitle || 'Chat',
    });
  }, [partner.name, listingTitle]);

  const markAsRead = useCallback(async () => {
    if (!user || !roomId) return;
    
    try {
      const response = await client.post(`/chats/${roomId}/messages/read`);
      if (response.data.marked_read > 0) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          is_read: msg.sender_id !== user.id ? true : msg.is_read
        })));
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', markAsRead);
    return unsubscribe;
  }, [navigation, markAsRead]);

  useEffect(() => {
    const handleMessagesRead = (data: { room_id: number }) => {
      if (data.room_id === roomId) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          is_read: msg.sender_id === user?.id ? true : msg.is_read
        })));
      }
    };

    socket.on('messages_read', handleMessagesRead);
    return () => {
      socket.off('messages_read', handleMessagesRead);
    };
  }, [roomId, user?.id]);

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
        uniqueKey: tempKey,
        is_read: false
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

      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(msg => msg.uniqueKey !== tempKey));
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    console.log('Partner avatar URI:', partner.avatar);
    const isCurrentUser = item.sender_id === user?.id;
    const isLastMessage = index === messages.length - 1;
    const showReadReceipt = isCurrentUser && isLastMessage;

    return (
      <View style={[
        styles.messageGroup,
        isCurrentUser && styles.currentUserGroup
      ]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          maxWidth: '80%',
        }}>
          {!isCurrentUser && (
            <View style={styles.avatarContainer}>
              {partner.avatar ? (
                <Image 
                  source={{ 
                    uri: partner.avatar.includes('http') 
                      ? partner.avatar 
                      : `${BACKEND_BASE_URL}${partner.avatar}`,
                    cache: 'force-cache'
                  }}
                  style={styles.avatar}
                  onError={(e) => console.log('Failed to load avatar:', e.nativeEvent.error)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={20} color="#666" />
                </View>
              )}
            </View>
          )}
          <View style={[
            styles.messageBubble,
            isCurrentUser 
              ? styles.currentUserMessage 
              : styles.otherUserMessage
          ]}>
            <Text style={[
              styles.messageText,
              isCurrentUser 
                ? styles.currentUserText 
                : styles.otherUserText
            ]}>
              {item.content}
            </Text>
          </View>
        </View>
        
        {showReadReceipt && (
          <Text style={styles.readReceipt}>
            {item.is_read ? 'Read' : 'Delivered'}
          </Text>
        )}
      </View>
    );
  };

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
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.uniqueKey}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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