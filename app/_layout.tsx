import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { authAPI } from '../services/api';

function CustomDrawerContent(props: any) {
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
              await authAPI.logout();
              // You can add navigation to login screen here
              // For now, we'll just show an alert
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={CustomDrawerContent}
        screenOptions={{
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
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{
            drawerLabel: 'Home',
            title: 'Home',
            headerLeft: ({ onPress }) => (
              <Pressable onPress={onPress} className="ml-4">
                <Ionicons name="menu" size={24} color="#FAD90E" />
              </Pressable>
            ),
          }} 
        />
        <Drawer.Screen 
          name="create-enquiry" 
          options={{
            drawerLabel: 'Create Sales Order',
            title: 'Create Sales Order',
            headerLeft: ({ onPress }) => (
              <Pressable onPress={onPress} className="ml-4">
                <Ionicons name="menu" size={24} color="#FAD90E" />
              </Pressable>
            ),
          }} 
        />
        <Drawer.Screen 
          name="confirmed-orders" 
          options={{
            drawerLabel: 'Orders Tracker',
            title: 'Orders Tracker',
            headerLeft: ({ onPress }) => (
              <Pressable onPress={onPress} className="ml-4">
                <Ionicons name="menu" size={24} color="#FAD90E" />
              </Pressable>
            ),
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}