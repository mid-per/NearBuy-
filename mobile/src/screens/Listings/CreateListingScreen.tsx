import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import client from '@/api/client';
import { isAxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';

type CreateListingScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateListing'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    padding: 12,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  requiredField: {
    color: '#FF3B30',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 5,
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      const fileInfo = await FileSystem.getInfoAsync(image);
      const fileContent = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
  
      const uploadResponse = await client.post('/upload', {
        image: `data:image/${fileExt};base64,${fileContent}`,
        filename: `listing_${Date.now()}.${fileExt}`
      });
  
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
        navigation.navigate('Marketplace', { refreshTimestamp: Date.now() });
      }
    } catch (error) {
      let errorDetails = '';
      if (isAxiosError(error)) {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Section */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialIcons name="photo-camera" size={40} color="#666" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={pickImage}
          >
            <Text style={styles.secondaryButtonText}>
              {image ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.label}>
          Title <Text style={styles.requiredField}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter listing title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Price */}
        <Text style={styles.label}>
          Price <Text style={styles.requiredField}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#999"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        {/* Category */}
        <Text style={styles.label}>
          Category <Text style={styles.requiredField}>*</Text>
        </Text>
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

        {/* Submit Button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              (!title || !price || !category || !image) && { opacity: 0.6 }
            ]}
            onPress={handleSubmit}
            disabled={!title || !price || !category || !image}
          >
            <Text style={styles.buttonText}>Create Listing</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}