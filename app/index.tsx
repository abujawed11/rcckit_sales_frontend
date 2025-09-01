import "../global.css"
import { Text, View, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
 
export default function Home() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="bg-primary-950 px-6 py-8">
          <View className="flex-row items-center justify-center">
            <Ionicons name="cube" size={32} color="#FAD90E" />
            <Text className="text-secondary-DEFAULT text-2xl font-bold ml-3">
              Sunrack RCC Kit
            </Text>
          </View>
          <Text className="text-secondary-DEFAULT/80 text-center mt-2 text-lg">
            Sales Management System
          </Text>
        </View>
        
        <View className="p-6">
          <Text className="text-2xl font-bold text-primary-950 mb-6">
            Welcome to Dashboard
          </Text>
          
          <View className="space-y-4">
            <View className="bg-white rounded-xl shadow-md p-6 border-l-4 border-secondary-DEFAULT">
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={24} color="#FAD90E" />
                <Text className="text-lg font-semibold text-primary-950 ml-3">
                  Create Sales Order
                </Text>
              </View>
              <Text className="text-gray-600 mt-2">
                Create new enquiries for RCC Kit orders from clients
              </Text>
            </View>
            
            <View className="bg-white rounded-xl shadow-md p-6 border-l-4 border-secondary-DEFAULT">
              <View className="flex-row items-center">
                <Ionicons name="list" size={24} color="#FAD90E" />
                <Text className="text-lg font-semibold text-primary-950 ml-3">
                  Orders Tracker
                </Text>
              </View>
              <Text className="text-gray-600 mt-2">
                View and track all confirmed orders and their status
              </Text>
            </View>
            
            <View className="bg-white rounded-xl shadow-md p-6 border-l-4 border-secondary-DEFAULT">
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={24} color="#FAD90E" />
                <Text className="text-lg font-semibold text-primary-950 ml-3">
                  Analytics
                </Text>
              </View>
              <Text className="text-gray-600 mt-2">
                View sales performance and order statistics
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}