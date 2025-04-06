import React from 'react';
import { RNCamera } from 'react-native-camera';
import { API } from '../../services/api';

export default function QRScanner({ route }) {
  const { transactionId } = route.params;

  const handleScan = async ({ data }) => {
    if (data.startsWith('nearbuy:')) {
      await API.post(`/transactions/${transactionId}/confirm`);
      navigation.goBack();
    }
  };

  return (
    <RNCamera
      style={{ flex: 1 }}
      onBarCodeRead={handleScan}
      captureAudio={false}
    />
  );
}