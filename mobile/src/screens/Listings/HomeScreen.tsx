import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to NearBuy!</Text>
      <Button
        title="Go to Listings"
        onPress={() => navigation.navigate('Listings')}
      />
    </View>
  );
}