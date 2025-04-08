import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { AxiosError } from 'axios';

type QRScannerScreenProp = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 20,
  },
  overlayText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  }
});

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation<QRScannerScreenProp>();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!data.startsWith('nearbuy:') || scanned) return;
    setScanned(true);
    
    setIsProcessing(true);
    try {
      const response = await client.post('/transactions/confirm', { qr_code: data });
      
      if (response.status === 200) {
        Alert.alert(
          'Success', 
          'Transaction confirmed!',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to confirm transaction';
      
      if (error instanceof AxiosError) {
        errorMessage = error.response?.status === 410 
          ? 'QR code expired' 
          : error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      setScanned(false); // Allow rescan after error
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text>Camera permission not granted</Text>
        <Button
          title="Request Permission"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text>Processing transaction...</Text>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Scan NearBuy QR Code</Text>
          </View>
        </CameraView>
      )}
    </View>
  );
}