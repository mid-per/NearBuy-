import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined; 
  Home: undefined;
  Marketplace: undefined;
  YourListings: undefined;
  Listings: undefined;
  CreateListing: undefined;
  QRGenerate: { listingId: string }; 
  QRScanner: undefined;
  ListingDetails: { listingId: number };
  Inbox: undefined;
  Chat: { 
    roomId: number;
    listingId: number;
    sellerId: number;
    buyerId: number; // Add this
    listingTitle: string;
  };
  Rating: {
    transactionId: number;
    seller: {
      id: number;
      name: string;
      avatar?: string;
    };
  };
  Profile: undefined;
  EditBasicProfile: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  // Add other screens here as you create them
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
