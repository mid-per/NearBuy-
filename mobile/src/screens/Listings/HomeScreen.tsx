import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    width: '48%',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
  },
});

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp>();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NearBuy</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            style={styles.iconButton}
          >
            <MaterialIcons name="person" size={28} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Inbox')}
            style={styles.iconButton}
          >
            <MaterialIcons name="inbox" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
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

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Text style={styles.buttonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}