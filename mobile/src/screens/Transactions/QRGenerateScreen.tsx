import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import client from '@/api/client';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { useUser } from '@/contexts/UserContext';
import { MaterialIcons } from '@expo/vector-icons';

type QRGenerateScreenProp = NativeStackNavigationProp<RootStackParamList, 'QRGenerate'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
});

export default function QRGenerateScreen() {
  const [qrData, setQrData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const route = useRoute();
  const { listingId } = route.params as { listingId: string };
  const navigation = useNavigation<QRGenerateScreenProp>();
  const { user } = useUser();

  useEffect(() => {
    const generateQR = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

        setIsLoading(true);
        setError('');
        
        const response = await client.post('/transactions/qr', {
          listing_id: listingId
        });

        if (!response.data?.qr_code) {
          throw new Error('Invalid QR code response');
        }

        setQrData(response.data.qr_code);
      } catch (error: unknown) {
        let errorMessage = 'Failed to generate QR code';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.error || error.message;
          }
        }
        
        console.error('QR Generation Error:', error);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [listingId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating QR Code...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF3B30" style={{ marginBottom: 15 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('QRGenerate', { listingId })}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f5f5f5', marginTop: 15, borderWidth: 1, borderColor: '#ddd' }]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[styles.buttonText, { color: '#007AFF' }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Transaction QR Code</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={qrData}
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>

        <Text style={styles.instructionText}>
          Show this QR code to the buyer to complete the transaction
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}