import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/Auth/LoginScreen';
import HomeScreen from '@/screens/Listings/HomeScreen';
import SearchListingsScreen from '@/screens/Listings/SearchListingsScreen';
import QRGenerateScreen from '@/screens/Transactions/QRGenerateScreen';
import QRScannerScreen from '@/screens/Transactions/QRScannerScreen';

// Define your root stack param types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Listings: undefined;
  QRGenerate: { listingId: string };  // Add this line
  QRScanner: undefined;               // Add this line
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'NearBuy Login' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Welcome' }}
        />
        <Stack.Screen 
          name="Listings" 
          component={SearchListingsScreen}
          options={{ title: 'Browse Listings' }}
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