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
import InboxScreen from '@/screens/Inbox/InboxScreen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { RootStackParamList } from '@/types/navigation';
import ListingDetailsScreen from '@/screens/Listings/ListingDetailsScreen';
import ChatScreen from '@/screens/Chat/ChatScreen';
import { UserProvider } from '@/contexts/UserContext';
import ProfileScreen from '@/screens/Auth/ProfileScreen';
import YourListingsScreen from '@/screens/Listings/YourListingsScreen';
import RatingScreen from '@/screens/Transactions/RatingScreen';

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
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerBackTitle: '',
            animation: 'fade', // Smoother transitions
            animationDuration: 150, // Faster animation
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ 
              title: 'NearBuy',
              headerBackVisible: false 
            }} 
          />
          <Stack.Screen 
            name="Marketplace" 
            component={MarketplaceScreen} 
            options={{ title: 'Browse Listings' }} 
          />
          <Stack.Screen 
            name="YourListings" 
            component={YourListingsScreen} 
            options={{ 
              title: 'Your Listings',
            }} 
          />
          <Stack.Screen 
            name="ListingDetails" 
            component={ListingDetailsScreen} 
            options={{ 
              title: 'Listing Details',
              headerBackVisible: false 
             }} 
          />
          <Stack.Screen 
            name="CreateListing" 
            component={CreateListingScreen} 
            options={{ title: 'Create Listing' }} 
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ 
              title: 'Login',
              headerBackVisible: false,
              headerLeft: () => null
            }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Register' }} 
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
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={({ route }) => ({
              title: route.params.listingTitle 
                ? `Chat: ${route.params.listingTitle.substring(0, 20)}${route.params.listingTitle.length > 20 ? '...' : ''}`
                : 'Chat'
            })} 
          />
          <Stack.Screen 
            name="Inbox" 
            component={InboxScreen} 
            options={{ title: 'Your Messages' }} 
          />
          <Stack.Screen 
            name="Rating" 
            component={RatingScreen}
            options={{ title: 'Rate Seller' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'My Profile' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}