// src/screens/Admin/UserManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '@/api/client';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '@/contexts/UserContext';

type AdminScreenProp = NativeStackNavigationProp<RootStackParamList, 'UserManagement'>;

interface User {
  id: number;
  email: string;
  name: string | null;
  is_admin: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  adminText: {
    color: 'white',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const navigation = useNavigation<AdminScreenProp>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('API Error:', error); 
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (userId: number) => {
    if (user?.id === userId) {
      Alert.alert('Error', 'You cannot delete yourself');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/admin/users/${userId}`);
              fetchUsers(); // Refresh the list
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="admin-panel-settings" size={24} color="#007AFF" />
        <Text style={styles.title}>User Management</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <View style={styles.userInfo}>
              <Text style={styles.email}>
                {item.email}
                {item.is_admin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </Text>
              <Text style={styles.role}>
                {item.name || 'No name provided'}
              </Text>
            </View>
            {!item.is_admin && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(item.id)}
              >
                <MaterialIcons name="delete" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}