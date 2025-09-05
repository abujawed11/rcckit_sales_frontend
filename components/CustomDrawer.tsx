import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      {/* Header Section with Enhanced Design */}
      <View className="px-6 py-10 relative">
        <LinearGradient
          colors={['#FAD90E', '#fbbf24', '#f59e0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0 rounded-br-3xl"
        />
        <View className="relative">
          <View className="flex-row items-center mb-2">
            <View className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Ionicons name="cube" size={28} color="#000000" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-primary-950 text-xl font-bold leading-tight">
                Sunrack RCC Kit
              </Text>
              <Text className="text-primary-800 text-sm font-medium mt-1">
                Sales Management
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Navigation Section */}
      <DrawerContentScrollView 
        {...props} 
        style={{ backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-4">
          {/* Navigation Items */}
          <View className="space-y-2">
            <DrawerItem
              label="Home"
              labelStyle={{ 
                color: '#ffffff', 
                fontSize: 16, 
                fontWeight: '600',
                marginLeft: -16
              }}
              style={{
                backgroundColor: 'rgba(250, 217, 14, 0.1)',
                borderRadius: 12,
                marginVertical: 4,
                paddingHorizontal: 8,
              }}
              icon={({ focused }) => (
                <View className={`p-2 rounded-lg ${focused ? 'bg-secondary-DEFAULT/20' : 'bg-white/10'}`}>
                  <Ionicons 
                    name="home" 
                    size={20} 
                    color={focused ? '#FAD90E' : '#ffffff'} 
                  />
                </View>
              )}
              onPress={() => props.navigation.navigate('index')}
            />
            
            <DrawerItem
              label="Create Sales Order"
              labelStyle={{ 
                color: '#ffffff', 
                fontSize: 16, 
                fontWeight: '600',
                marginLeft: -16
              }}
              style={{
                backgroundColor: 'rgba(250, 217, 14, 0.1)',
                borderRadius: 12,
                marginVertical: 4,
                paddingHorizontal: 8,
              }}
              icon={({ focused }) => (
                <View className={`p-2 rounded-lg ${focused ? 'bg-secondary-DEFAULT/20' : 'bg-white/10'}`}>
                  <Ionicons 
                    name="add-circle" 
                    size={20} 
                    color={focused ? '#FAD90E' : '#ffffff'} 
                  />
                </View>
              )}
              onPress={() => props.navigation.navigate('create-enquiry')}
            />
            
            <DrawerItem
              label="Orders Tracker"
              labelStyle={{ 
                color: '#ffffff', 
                fontSize: 16, 
                fontWeight: '600',
                marginLeft: -16
              }}
              style={{
                backgroundColor: 'rgba(250, 217, 14, 0.1)',
                borderRadius: 12,
                marginVertical: 4,
                paddingHorizontal: 8,
              }}
              icon={({ focused }) => (
                <View className={`p-2 rounded-lg ${focused ? 'bg-secondary-DEFAULT/20' : 'bg-white/10'}`}>
                  <Ionicons 
                    name="list" 
                    size={20} 
                    color={focused ? '#FAD90E' : '#ffffff'} 
                  />
                </View>
              )}
              onPress={() => props.navigation.navigate('confirmed-orders')}
            />
          </View>
          
          {/* Separator with gradient */}
          <View className="my-8">
            <LinearGradient
              colors={['transparent', '#FAD90E', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-px"
            />
          </View>
          
          {/* Logout Section */}
          <DrawerItem
            label="Logout"
            labelStyle={{ 
              color: '#ff6b6b', 
              fontSize: 16, 
              fontWeight: '600',
              marginLeft: -16
            }}
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderRadius: 12,
              marginVertical: 4,
              paddingHorizontal: 8,
            }}
            icon={({ focused }) => (
              <View className={`p-2 rounded-lg ${focused ? 'bg-red-500/20' : 'bg-white/10'}`}>
                <Ionicons 
                  name="log-out" 
                  size={20} 
                  color={focused ? '#ff6b6b' : '#ff6b6b'} 
                />
              </View>
            )}
            onPress={handleLogout}
          />
        </View>
      </DrawerContentScrollView>
      
      {/* Footer with subtle branding */}
      <View className="px-6 py-4 border-t border-white/10">
        <Text className="text-white/60 text-xs text-center">
          © 2025 Sunrack RCC Kit • v1.0.0
        </Text>
      </View>
    </LinearGradient>
  );
}