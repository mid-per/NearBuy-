// components/CustomBackButton.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CustomBackButton = ({ onPress }: { onPress?: () => void }) => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginLeft: 15 }}>
      <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
};

export default CustomBackButton;