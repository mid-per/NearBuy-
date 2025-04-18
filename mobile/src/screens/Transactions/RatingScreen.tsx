import React, { useState } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { BACKEND_BASE_URL } from '@/config';

type RatingScreenProp = NativeStackNavigationProp<RootStackParamList, 'Rating'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 25,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  sellerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  star: {
    marginHorizontal: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  tagSection: {
    marginBottom: 30,
  },
  tagSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTag: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTagText: {
    color: '#fff',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 10,
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {seller.avatar ? (
            <Image
              source={{ 
                uri: seller.avatar.startsWith('http') 
                  ? seller.avatar 
                  : `${BACKEND_BASE_URL}${seller.avatar}`,
                cache: 'force-cache'
              }}
              style={styles.avatar}
            />
          ) : (
            <MaterialIcons name="person" size={50} color="#666" />
          )}
        </View>
        <Text style={styles.sellerName}>Rate your experience</Text>
        <Text style={styles.ratingText}>How was your transaction with {seller.name}?</Text>
      </View>
  
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity 
              key={star} 
              onPress={() => setRating(star)}
              style={styles.star}
            >
              <MaterialIcons
                name={star <= rating ? 'star' : 'star-outline'}
                size={42}
                color={star <= rating ? '#FFD700' : '#ccc'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
  
      {rating > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagSectionTitle}>
            {rating <= 2 ? 'What went wrong?' : 'What did you like?'}
          </Text>
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
        </View>
      )}
  
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!rating || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!rating || isSubmitting}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
          {isSubmitting && (
            <ActivityIndicator 
              size="small" 
              color="#fff" 
              style={styles.loadingIndicator}
            />
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}