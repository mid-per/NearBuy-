import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined; 
  Main: undefined;
  Marketplace: {
    refreshTimestamp?: number;
  };
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
    buyerId: number; 
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
  PublicProfile: { userId: number };
  SellerListings: {
    sellerId: number;
    sellerName?: string; 
  };
  EditBasicProfile: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  
  // Add other screens here as you create them
};

export type MainTabParamList = {
  Marketplace: { refreshTimestamp?: number };
  CreateListing: undefined;
  QRScanner: undefined;
  Inbox: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
