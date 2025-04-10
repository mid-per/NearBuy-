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
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to NearBuy!</Text>

      <View style={styles.button}>
        <Button
          title="Browse Marketplace"
          onPress={() => navigation.navigate('Marketplace')}
          color="#FF9500"
        />
      </View>
      
      <View style={styles.button}>
        <Button
          title="Create New Listing"
          onPress={() => navigation.navigate('CreateListing')}
          color="#FF9500"  // Orange color for primary action
        />
      </View>

      <View style={styles.button}>
        <Button
          title="Generate QR Code"
          onPress={() => navigation.navigate('QRGenerate', { listingId: '1' })}
          color="#007AFF"  // Blue color
        />
      </View>

      <View style={styles.button}>
        <Button
          title="Scan QR Code"
          onPress={() => navigation.navigate('QRScanner')}
          color="#34C759"  // Green color
        />
      </View>
    </View>
  );
}