// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import LoginScreen from '@/screens/Auth/LoginScreen';
import RegisterScreen from '@/screens/Auth/RegisterScreen';
import MarketplaceScreen from '@/screens/Listings/MarketplaceScreen';
import CreateListingScreen from '@/screens/Listings/CreateListingScreen';
import ListingDetailsScreen from '@/screens/Listings/ListingDetailsScreen';
import SellerListingsScreen from '@/screens/Listings/SellerListingsScreen';
import QRGenerateScreen from '@/screens/Transactions/QRGenerateScreen';
import QRScannerScreen from '@/screens/Transactions/QRScannerScreen';
import InboxScreen from '@/screens/Inbox/InboxScreen';
import ChatScreen from '@/screens/Chat/ChatScreen';
import ProfileScreen from '@/screens/Profile/ProfileScreen';
import RatingScreen from '@/screens/Transactions/RatingScreen';
import EditBasicProfileScreen from '@/screens/Profile/EditBasicProfileScreen';
import ChangeEmailScreen from '@/screens/Profile/ChangeEmailScreen';
import ChangePasswordScreen from '@/screens/Profile/ChangePasswordScreen';
import PurchaseHistoryScreen from '@/screens/Profile/PurchaseHistoryScreen';
import UserManagementScreen from '@/screens/Admin/UserManagementScreen';
// Context and Types
import { UserProvider } from '@/contexts/UserContext';
import { RootStackParamList, MainTabParamList } from '@/types/navigation';


const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="Marketplace" 
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
          headerTitle: 'Marketplace',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="CreateListing" 
        component={CreateListingScreen}
        options={{
          tabBarLabel: 'Sell',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle" size={size} color={color} />
          ),
          headerTitle: 'Create Listing',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size} color={color} />
          ),
          headerTitle: 'Scan QR Code',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inbox" size={size} color={color} />
          ),
          headerTitle: 'Messages',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
          headerTitle: 'My Profile',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}

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
            animation: 'fade',
            animationDuration: 150,
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ 
              title: '',
              headerBackVisible: false,
              headerLeft: () => null
            }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: '' }} 
          />
          <Stack.Screen 
            name="UserManagement" 
            component={UserManagementScreen} 
            options={{ title: '' }} 
          />
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ListingDetails" 
            component={ListingDetailsScreen} 
            options={{ title: 'Listing Details' }} 
          />
          <Stack.Screen 
            name="QRGenerate"
            component={QRGenerateScreen} 
            options={{ title: 'Generate QR Code' }} 
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
            name="Rating" 
            component={RatingScreen}
            options={{ title: 'Rate Seller' }}
          />
          <Stack.Screen 
            name="EditBasicProfile" 
            component={EditBasicProfileScreen} 
            options={{ title: 'Edit Profile' }} 
          />
          <Stack.Screen 
            name="SellerListings" 
            component={SellerListingsScreen} 
            options={{ title: ''}} 
          />
          <Stack.Screen 
            name="PurchaseHistory" 
            component={PurchaseHistoryScreen}
            options={{ title: '' }}
          />
          <Stack.Screen 
            name="CreateListing" 
            component={CreateListingScreen} 
            options={{ title: 'Create Listing' }} 
          />
          <Stack.Screen 
            name="ChangeEmail" 
            component={ChangeEmailScreen} 
            options={{ title: 'Change Email' }} 
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen} 
            options={{ title: 'Change Password' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}