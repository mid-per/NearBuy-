import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ListingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Listings'
>;

export default function SearchListingsScreen() {
  const navigation = useNavigation<ListingsScreenNavigationProp>();

  return (
    <View>
      <Text>Listings will appear here</Text>
    </View>
  );
}