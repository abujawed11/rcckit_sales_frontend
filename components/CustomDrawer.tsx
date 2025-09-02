import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-primary-950">
      <View className="px-6 py-8 bg-secondary-DEFAULT">
        <View className="flex-row items-center">
          <Ionicons name="cube" size={32} color="#000000" />
          <Text className="text-primary-950 text-xl font-bold ml-3">
            Sunrack RCC Kit
          </Text>
        </View>
      </View>
      
      <DrawerContentScrollView {...props} className="flex-1 bg-primary-950">
        <View className="px-4 py-2">
          <DrawerItem
            label="Home"
            labelStyle={{ color: '#FAD90E', fontSize: 16, fontWeight: '600' }}
            icon={({ focused }) => (
              <Ionicons 
                name="home" 
                size={24} 
                color={focused ? '#FAD90E' : '#FAD90E'} 
              />
            )}
            onPress={() => props.navigation.navigate('index')}
          />
          
          <DrawerItem
            label="Create Sales Order"
            labelStyle={{ color: '#FAD90E', fontSize: 16, fontWeight: '600' }}
            icon={({ focused }) => (
              <Ionicons 
                name="add-circle" 
                size={24} 
                color={focused ? '#FAD90E' : '#FAD90E'} 
              />
            )}
            onPress={() => props.navigation.navigate('create-enquiry')}
          />
          
          <DrawerItem
            label="Orders Tracker"
            labelStyle={{ color: '#FAD90E', fontSize: 16, fontWeight: '600' }}
            icon={({ focused }) => (
              <Ionicons 
                name="list" 
                size={24} 
                color={focused ? '#FAD90E' : '#FAD90E'} 
              />
            )}
            onPress={() => props.navigation.navigate('confirmed-orders')}
          />
          
          <View className="border-t border-secondary-DEFAULT/30 my-4" />
          
          <DrawerItem
            label="Logout"
            labelStyle={{ color: '#FAD90E', fontSize: 16, fontWeight: '600' }}
            icon={({ focused }) => (
              <Ionicons 
                name="log-out" 
                size={24} 
                color={focused ? '#FAD90E' : '#FAD90E'} 
              />
            )}
            onPress={handleLogout}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
}