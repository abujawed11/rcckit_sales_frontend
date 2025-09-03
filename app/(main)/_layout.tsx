import CustomDrawer from '@/components/CustomDrawer';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  View,
  Pressable
} from 'react-native';

export default function MainLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-950">
        <ActivityIndicator size="large" color="#FAD90E" />
      </View>
    );
  }

  if (!user?.success) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: 'front',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FAD90E',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#FAD90E',
        },
        sceneContainerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerLeft: () => (
          <Pressable onPress={() => navigation.openDrawer()} className="ml-4">
            <Ionicons name="menu" size={24} color="#FAD90E" />
          </Pressable>
        ),
      })}
    >

      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="create-enquiry"
        options={{
          drawerLabel: 'Create Sales Order',
          title: 'Create Sales Order',
        }}
      />
      <Drawer.Screen
        name="confirmed-orders"
        options={{
          drawerLabel: 'Orders Tracker',
          title: 'Orders Tracker',
        }}
      />
      <Drawer.Screen
        name="order-kits"
        options={{
          drawerLabel: 'Kits Specifications',
          title: 'Kits Specifications',
        }}
      />
      <Drawer.Screen
        name="order-address"
        options={{
          drawerLabel: 'Address Details',
          title: 'Address Details',
        }}
      />
    </Drawer>
  );
}

