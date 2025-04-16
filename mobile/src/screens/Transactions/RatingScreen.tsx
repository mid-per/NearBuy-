// src/screens/Transactions/RatingScreen.tsx
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

type RatingScreenProp = NativeStackNavigationProp<RootStackParamList, 'Rating'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sellerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  star: {
    marginHorizontal: 5,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  tag: {
    padding: 10,
    margin: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  selectedTag: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    color: '#007AFF',
  },
  selectedTagText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const TAGS = {
  1: ['Rude', 'Late', 'Poor Condition'],
  2: ['Unfriendly', 'Slow', 'Okay'],
  3: ['Average', 'Normal', 'Satisfactory'],
  4: ['Polite', 'On Time', 'Good'],
  5: ['Excellent', 'Friendly', 'Perfect'],
};

export default function RatingScreen() {
  const navigation = useNavigation<RatingScreenProp>();
  const route = useRoute();
  const { transactionId, seller } = route.params as {
    transactionId: number;
    seller: { id: number; name: string; avatar?: string };
  };
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const handleSubmit = async () => {
    if (!rating) return;
    
    try {
      setIsSubmitting(true);
      await client.post(`/transactions/${transactionId}/rate`, {
        rating,
        feedback: selectedTags.join(', '),
      });
      navigation.navigate('Main');
    } catch (error) {
      console.error('Rating failed:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sellerInfo}>
        <Image
          source={{ uri: seller.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Rate {seller.name}</Text>
      </View>

      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)}
            style={styles.star}
          >
            <MaterialIcons
              name={star <= rating ? 'star' : 'star-border'}
              size={40}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {rating > 0 && (
        <View style={styles.tagContainer}>
          {TAGS[rating as keyof typeof TAGS]?.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.selectedTag
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[
                styles.tagText,
                selectedTags.includes(tag) && styles.selectedTagText
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={!rating || isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}