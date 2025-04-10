import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined; 
  Home: undefined;
  Marketplace: undefined;
  Listings: undefined;
  CreateListing: undefined;
  QRGenerate: { listingId: string };
  QRScanner: undefined;
  ListingDetails: { listingId: number };
  Chat: { 
    roomId: number;
    listingId: number;
    sellerId: number;
  };
  // Add other screens here as you create them
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
