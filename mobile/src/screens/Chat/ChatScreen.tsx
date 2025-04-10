// src/screens/Chat/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp } from '@react-navigation/native';
import { ChatMessage } from '@/types/chat';
import { MaterialIcons } from '@expo/vector-icons';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
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
  const { sellerId, listingId } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // TODO: Replace with actual API call
        const mockMessages: ChatMessage[] = [
          {
            id: '1',
            text: 'Hello, is this still available?',
            senderId: 123, // This would be the buyer's ID
            timestamp: new Date(Date.now() - 3600000),
            isCurrentUser: false,
          },
          {
            id: '2',
            text: 'Yes, it is!',
            senderId: sellerId,
            timestamp: new Date(),
            isCurrentUser: true,
          },
        ];
        setMessages(mockMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sellerId, listingId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        senderId: 123, // This should be the current user's ID
        timestamp: new Date(),
        isCurrentUser: true,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      // TODO: Send message to backend
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.messageList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.isCurrentUser ? styles.currentUserText : styles.otherUserText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <MaterialIcons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}