import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined; 
  Home: undefined;
  Listings: undefined;
  CreateListing: undefined;
  QRGenerate: { listingId: string };
  QRScanner: undefined;
  // Add other screens here as you create them
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
