import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp>();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NearBuy</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
          <MaterialIcons name="inbox" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Marketplace')}
        >
          <Text style={styles.buttonText}>Browse Listings</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={styles.buttonText}>Sell Item</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('QRGenerate', { listingId: '1' })}
      >
        <Text style={styles.buttonText}>Generate QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
}