import React, { useState } from 'react';
import { 
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { isAxiosError } from 'axios';

type CreateListingScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateListing'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginVertical: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryButton: {
    padding: 10,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    color: '#000',
  },
  selectedCategoryText: {
    color: '#fff',
  },
});

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Vehicles',
  'Other',
];

export default function CreateListingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<CreateListingScreenProp>();

  const handleSubmit = async () => {
    if (!title || !price || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsLoading(true);

    try {
      const response = await client.post('/listings', {
        title,
        description,
        price: priceNumber,
        category,
      });

      if (response.status === 201) {
        Alert.alert(
          'Success',
          'Listing created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to create listing';
      
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Listing</Text>

      <TextInput
        style={styles.input}
        placeholder="Title*"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Price*"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <Text>Category*</Text>
      <View style={styles.categoryContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              category === cat && styles.selectedCategory,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat && styles.selectedCategoryText,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={styles.button}>
          <Button
            title="Create Listing"
            onPress={handleSubmit}
            color="#007AFF"
            disabled={!title || !price || !category}
          />
        </View>
      )}
    </ScrollView>
  );
}