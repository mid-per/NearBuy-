import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Listings: undefined;
  // Add other screens here as you create them
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
