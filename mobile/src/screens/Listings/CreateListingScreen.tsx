import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, TouchableOpacity, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  addPhotoButton: {
    backgroundColor: '#f0f0f0',
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
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<CreateListingScreenProp>();

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload photos');
      return;
    }

    // Updated to modern Expo ImagePicker API
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Simplified media type
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };
  
  const handleSubmit = async () => {
    if (!title || !price || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!image) {
      Alert.alert('Error', 'Please add a photo of your item');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload image
      const fileInfo = await FileSystem.getInfoAsync(image);
      const fileContent = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
  
      const uploadResponse = await client.post('/upload', {
        image: `data:image/${fileExt};base64,${fileContent}`,
        filename: `listing_${Date.now()}.${fileExt}`
      });
  
      // 2. Create listing
      const response = await client.post('/listings', {
        title: title.trim(),
        description: description.trim(),
        price: priceNumber,
        category: category.trim(),
        image_url: uploadResponse.data.url
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 201) {
        Alert.alert('Success', 'Listing created!');
        // Navigate back to Marketplace with refresh parameter
        navigation.navigate('Marketplace', { refreshTimestamp: Date.now() });
      }
    } catch (error) {
      let errorDetails = '';
      if (isAxiosError(error)) {
        console.log('Full error response:', error.response);
        errorDetails = error.response?.data?.details || error.response?.data?.error;
      }
      Alert.alert(
        'Error',
        `Failed to create listing${errorDetails ? `: ${errorDetails}` : ''}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.imageContainer}>
        {image && (
          <Image 
            source={{ uri: image }} 
            style={styles.image} 
          />
        )}
        <View style={[styles.button, styles.addPhotoButton]}>
          <Button
            title={image ? 'Change Photo' : 'Add Photo'}
            onPress={pickImage}
            color="#888"
          />
        </View>
      </View>

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
            disabled={!title || !price || !category || !image}
          />
        </View>
      )}
    </ScrollView>
  );
}