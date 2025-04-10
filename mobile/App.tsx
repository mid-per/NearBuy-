// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/Auth/LoginScreen';
import HomeScreen from '@/screens/Listings/HomeScreen';
import MarketplaceScreen from '@/screens/Listings/MarketplaceScreen';
import CreateListingScreen from '@/screens/Listings/CreateListingScreen';
import QRGenerateScreen from '@/screens/Transactions/QRGenerateScreen';
import QRScannerScreen from '@/screens/Transactions/QRScannerScreen';
import RegisterScreen from '@/screens/Auth/RegisterScreen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { RootStackParamList } from '@/types/navigation';
import ListingDetailsScreen from '@/screens/Listings/ListingDetailsScreen';
import ChatScreen from '@/screens/Chat/ChatScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'NearBuy Login' }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Create Account' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Welcome' }}
        />
        <Stack.Screen 
          name="Marketplace" 
          component={MarketplaceScreen}
          options={{ title: 'Browse Listings' }}
        />
        <Stack.Screen 
          name="CreateListing" 
          component={CreateListingScreen}
          options={{ title: 'Create Listing' }}
        />
        <Stack.Screen 
          name="ListingDetails" 
          component={ListingDetailsScreen}
          options={{ title: 'Listing Details' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ title: 'Chat with Seller' }}
        />
        <Stack.Screen 
          name="QRGenerate" 
          component={QRGenerateScreen}
          options={{ title: 'Generate QR Code' }}
        />
        <Stack.Screen 
          name="QRScanner" 
          component={QRScannerScreen}
          options={{ title: 'Scan QR Code' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}