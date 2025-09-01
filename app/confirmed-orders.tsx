import "../global.css";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { enquiryAPI } from '../services/api';

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';
  
  switch (status.toLowerCase()) {
    case 'completed':
      bgColor = 'bg-green-500';
      break;
    case 'in production':
      bgColor = 'bg-secondary-DEFAULT';
      textColor = 'text-primary-950';
      break;
    case 'pending':
      bgColor = 'bg-red-500';
      break;
  }
  
  return (
    <View className={`${bgColor} px-3 py-1 rounded-full`}>
      <Text className={`${textColor} text-sm font-semibold`}>{status}</Text>
    </View>
  );
};

const PaymentBadge = ({ paymentReceived, percentage }: { paymentReceived: string, percentage: string }) => {
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';
  let text = paymentReceived;
  
  switch (paymentReceived.toLowerCase()) {
    case 'yes':
      bgColor = 'bg-green-500';
      text = 'Paid';
      break;
    case 'partial':
      bgColor = 'bg-secondary-DEFAULT';
      textColor = 'text-primary-950';
      text = `${percentage}% Paid`;
      break;
    case 'no':
      bgColor = 'bg-red-500';
      text = 'Unpaid';
      break;
  }
  
  return (
    <View className={`${bgColor} px-3 py-1 rounded-full`}>
      <Text className={`${textColor} text-sm font-semibold`}>{text}</Text>
    </View>
  );
};

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order: any) => {
        const clientName = order.client_name?.toLowerCase() || '';
        const projectId = order.project_id?.toLowerCase() || '';
        const search = searchQuery.toLowerCase();
        
        return clientName.includes(search) || projectId.includes(search);
      });
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      const data = await enquiryAPI.getAll();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
      Alert.alert('Success', 'Orders have been updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh orders.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOrderPress = (order: any) => {
    Alert.alert(
      'Order Details',
      `Order: ${order.project_id || 'No Project ID'}\nClient: ${order.client_name || 'No Client Name'}\nStatus: ${order.production_status || 'Unknown'}\nTotal Kits: ${order.total_kits || '0'}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#FAD90E" />
        <Text className="text-primary-950 text-lg font-semibold mt-4">
          Loading orders...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary-950 px-6 py-6">
        <View className="flex-row items-center justify-center">
          <Ionicons name="list" size={28} color="#FAD90E" />
          <Text className="text-secondary-DEFAULT text-xl font-bold ml-3">
            Orders Tracker
          </Text>
        </View>
      </View>

      <View className="p-6">
        {/* Search Bar */}
        <View className="mb-4">
          <View className="relative">
            <Ionicons 
              name="search" 
              size={20} 
              color="#9CA3AF" 
              style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by client name or project ID..."
              className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Order Count */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-primary-950">
            Total Orders: {filteredOrders.length}
          </Text>
        </View>

        {/* Orders List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => handleOrderPress(order)}
              className="bg-white rounded-xl shadow-md p-4 mb-4 border-l-4 border-secondary-DEFAULT"
              android_ripple={{ color: '#FAD90E', borderless: false }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-primary-950 mb-1">
                    {order.project_id || 'No Project ID'}
                  </Text>
                  <Text className="text-gray-600 font-medium">
                    {order.client_name || 'No Client Name'}
                  </Text>
                </View>
                <View className="items-end">
                  <StatusBadge status={order.production_status || 'Unknown'} />
                </View>
              </View>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">PO Date:</Text>
                  <Text className="text-primary-950 font-semibold">
                    {order.po_date_str || 'Not specified'}
                  </Text>
                </View>
                
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Delivery Date:</Text>
                  <Text className="text-primary-950 font-semibold">
                    {order.delivery_date_str || 'Not specified'}
                  </Text>
                </View>
                
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Total Kits:</Text>
                  <Text className="text-primary-950 font-bold">
                    {order.total_kits || '0'}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Payment:</Text>
                  <PaymentBadge 
                    paymentReceived={order.payment_received || 'No'}
                    percentage={order.payment_percentage || '0'}
                  />
                </View>
                
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Partial Delivery:</Text>
                  <Text className={`font-semibold ${
                    order.partial_delivery_allowed === 'Yes' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {order.partial_delivery_allowed || 'Not specified'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-200">
                <Ionicons name="chevron-forward" size={20} color="#FAD90E" />
              </View>
            </Pressable>
          ))}

          {filteredOrders.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center">
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">
                No orders found
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'No confirmed orders available'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}