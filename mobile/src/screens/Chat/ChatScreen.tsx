import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp } from '@react-navigation/native';
import { ChatMessage } from '@/types/chat';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useUser } from '@/contexts/UserContext';
import socket from '@/utils/socket';

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
});

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { roomId, sellerId, listingId } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (!user || !roomId) return;
        
        const response = await client.get(`/chats/${roomId}/messages`);
        setMessages(response.data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.content,
          senderId: msg.sender_id,
          timestamp: new Date(msg.sent_at),
          isCurrentUser: msg.sender_id === user.id,
        })));
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load chat messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    socket.emit('join', { room_id: roomId });
    
    const handleNewMessage = (msg: any) => {
      setMessages(prev => [...prev, {
        id: msg.id.toString(),
        text: msg.content,
        senderId: msg.sender_id,
        timestamp: new Date(msg.timestamp),
        isCurrentUser: msg.sender_id === user?.id,
      }]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave', { room_id: roomId });
    };
  }, [roomId, user?.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !roomId) return;

    try {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        senderId: user.id,
        timestamp: new Date(),
        isCurrentUser: true,
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      socket.emit('send_message', {
        room_id: roomId,
        user_id: user.id,
        content: message
      });

      await client.post(`/chats/${roomId}/messages`, {
        content: message,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    }
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
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? styles.emptyChatContainer : styles.messageList}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
          ]}>
            <Text style={[
              styles.messageText,
              item.isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.text}
            </Text>
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