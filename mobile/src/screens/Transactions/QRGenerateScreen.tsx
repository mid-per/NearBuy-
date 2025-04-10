import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ActivityIndicator, StyleSheet, Button } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import client from '@/api/client';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { useUser } from '@/contexts/UserContext';

type QRGenerateScreenProp = NativeStackNavigationProp<RootStackParamList, 'QRGenerate'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
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
          // No buyer_id needed - will be set when scanned
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
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Generating QR Code...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={() => navigation.replace('QRGenerate', { listingId })}
        />
        <View style={{ marginTop: 10 }}>
          <Button
            title="Back to Home"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <QRCode
        value={qrData}
        size={250}
        color="black"
        backgroundColor="white"
      />
      <Text style={{ marginTop: 20, fontSize: 16 }}>
        Show this QR code to the buyer
      </Text>
      <View style={{ marginTop: 30 }}>
        <Button
          title="Done"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}