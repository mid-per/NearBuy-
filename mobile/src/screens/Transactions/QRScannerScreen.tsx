import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import client from '@/api/client';
import { AxiosError } from 'axios';
import { MaterialIcons } from '@expo/vector-icons';

type QRScannerScreenProp = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  frame: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
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
      
      navigation.navigate('Rating', {
        transactionId: response.data.transaction_id,
        seller: {
          id: response.data.seller_id,
          name: response.data.seller_name || `Seller ${response.data.seller_id}`,
          avatar: response.data.seller_avatar
        }
      });
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
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="camera" size={50} color="#007AFF" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>
          NearBuy needs camera permission to scan QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Processing transaction...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.frame} />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Scan NearBuy QR Code</Text>
        </View>
      </CameraView>
    </View>
  );
}