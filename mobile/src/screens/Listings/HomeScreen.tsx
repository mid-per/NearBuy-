import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    marginVertical: 10,
  },
});

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp>();

  return (
    <View style={styles.container}>
      <Text style={{ textAlign: 'center', marginBottom: 20, fontSize: 18 }}>
        Welcome to NearBuy!
      </Text>
      
      <View style={styles.button}>
        <Button
          title="Generate QR Code"
          onPress={() => navigation.navigate('QRGenerate', { listingId: '1' })}
          color="#007AFF"
        />
      </View>

      <View style={styles.button}>
        <Button
          title="Scan QR Code"
          onPress={() => navigation.navigate('QRScanner')}
          color="#34C759"
        />
      </View>
    </View>
  );
}