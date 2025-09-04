import "../../global.css";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { orderAPI, enquiryAPI } from '@/services/api';
import { Order } from '@/components/order/OrderTypes';
import { StatusBadge, PaymentBadge } from '@/components/order/StatusBadges';

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = orders.filter((order: any) => {
        const clientName = order.client_name?.toLowerCase() || '';
        const projectId = order.project_id?.toLowerCase() || '';
        const search = searchQuery.toLowerCase();
        
        return clientName.includes(search) || projectId.includes(search);
      });
    }
    
    // Sort by latest first (assuming orders have created_at or similar timestamp)
    // If no timestamp field exists, we'll sort by ID or order index
    filtered.sort((a, b) => {
      // Try to use created_at, updated_at, or id for sorting
      const aDate = a.created_at || a.updated_at || a.id;
      const bDate = b.created_at || b.updated_at || b.id;
      
      // If we have actual dates, parse them
      if (aDate && bDate) {
        const dateA = new Date(aDate).getTime() || parseInt(aDate) || 0;
        const dateB = new Date(bDate).getTime() || parseInt(bDate) || 0;
        return dateB - dateA; // Latest first
      }
      return 0;
    });
    
    setFilteredOrders(filtered);
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      let data;
      try {
        data = await orderAPI.getUserOrders();
      } catch (userOrdersError) {
        try {
          data = await orderAPI.getCustomerOrders();
        } catch (customerOrdersError) {
          try {
            data = await orderAPI.getAll();
          } catch (allOrdersError) {
            try {
              data = await enquiryAPI.getAll();
            } catch (enquiriesError) {
              console.error('All API endpoints failed:', enquiriesError);
              throw enquiriesError;
            }
          }
        }
      }
      
      setOrders(data || []);
      console.log("Ordrs: ",data)
      setFilteredOrders(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      setOrders([]);
      setFilteredOrders([]);
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

  const handleStatusUpdate = async (orderId: string, field: string, value: string, order?: Order) => {
    try {
      setLoading(true);
      const sr = (order as any)?.sr;
      if (sr) {
        const payload: any = {};
        payload[field] = value;
        await enquiryAPI.patchBySr(sr, payload);
      } else {
        const updatePayload: any = {};
        updatePayload[field] = value;
        await orderAPI.update(orderId, updatePayload);
      }
      await fetchOrders();
      Alert.alert('Success', 'Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToPage = (order: Order, page: string) => {
    const orderString = JSON.stringify(order);
    const orderData = JSON.stringify(order);
    
    switch (page) {
      case 'address':
        router.push({
          pathname: '/(main)/order-address',
          params: { order: orderString }
        });
        break;
      case 'kits':
        router.push({
          pathname: '/(main)/order-kits',
          params: { order: orderString, orderData: orderData }
        });
        break;
      case 'dispatch_lots':
        router.push({
          pathname: '/(main)/order-dispatch-lots',
          params: { order: orderString }
        });
        break;
      case 'qc_docs':
        router.push({
          pathname: '/(main)/order-qc-docs',
          params: { order: orderString }
        });
        break;
      case 'dispatch_docs':
        router.push({
          pathname: '/(main)/order-dispatch-docs',
          params: { order: orderString }
        });
        break;
    }
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

  // Calculate pagination
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 p-6">
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

        {/* Order Count and Pagination Info */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-lg font-semibold text-primary-950">
            Total Orders: {totalOrders}
          </Text>
          {totalPages > 1 && (
            <Text className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, totalOrders)}
            </Text>
          )}
        </View>

        {/* Pagination Controls - Top */}
        {totalPages > 1 && (
          <View className="mb-4 flex-row justify-center items-center space-x-4">
            <Pressable
              onPress={goToPrevPage}
              disabled={currentPage === 1}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                currentPage === 1 ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={currentPage === 1 ? '#9CA3AF' : '#0a0a0a'} 
              />
              <Text className={`ml-1 font-semibold ${
                currentPage === 1 ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Previous
              </Text>
            </Pressable>
            
            <Text className="text-primary-950 font-bold text-lg">
              {currentPage}
            </Text>
            
            <Pressable
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                currentPage === totalPages ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Text className={`mr-1 font-semibold ${
                currentPage === totalPages ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Next
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={currentPage === totalPages ? '#9CA3AF' : '#0a0a0a'} 
              />
            </Pressable>
          </View>
        )}

        {/* Orders Cards */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {currentOrders.map((order, index) => (
            <View key={order.id} className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden border-l-4 border-secondary">
              {/* Card Header */}
              <View className="bg-primary-950 px-4 py-3 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-secondary text-lg font-bold">
                    {order.project_id || `Order #${index + 1}`}
                  </Text>
                  <Text className="text-gray-300 text-sm">
                    {order.client_name || 'Unknown Client'}
                  </Text>
                </View>
                <View className="bg-secondary px-3 py-1 rounded-full">
                  <Text className="text-primary-950 font-bold text-sm">#{startIndex + index + 1}</Text>
                </View>
              </View>

              {/* Card Content */}
              <View className="p-4 space-y-4">
                {/* Order Info Row */}
                <View className="flex-row justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-xs mb-1">Order Value</Text>
                    <Text className="text-primary-950 font-bold text-sm">
                      {order.order_value || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-xs mb-1">Total Kits</Text>
                    <Text className="text-primary-950 font-bold text-sm">
                      {order.total_kits || '0'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs mb-1">Payment Status</Text>
                    <PaymentBadge 
                      paymentReceived={order.payment_received || 'No'}
                      percentage={order.payment_percentage || '0'}
                    />
                  </View>
                </View>

                {/* Dates Row */}
                <View className="flex-row justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-xs mb-1">Order Date</Text>
                    <Text className="text-primary-950 text-sm">
                      {order.created_at 
                        ? new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })
                        : order.po_date_str || 'Not available'
                      }
                    </Text>
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-xs mb-1">PO Date</Text>
                    <Text className="text-primary-950 text-sm">
                      {order.po_date_str || 'Not set'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs mb-1">Delivery Date</Text>
                    <Text className="text-primary-950 text-sm">
                      {order.delivery_date_str || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Status Management Section */}
                <View className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <Text className="text-primary-950 font-bold text-sm mb-2">Status Management</Text>
                  
                  {/* Production Status */}
                  <View>
                    <Text className="text-gray-600 text-xs mb-2">Production Status</Text>
                    <View className="border border-gray-300 rounded-md bg-white">
                      <Picker
                        selectedValue={order.production_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_status', value, order)}
                        style={{ height: 50, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Production Status" value="" />
                        <Picker.Item label="Planned" value="Planned" />
                        <Picker.Item label="WIP" value="WIP" />
                        <Picker.Item label="Done" value="Done" />
                      </Picker>
                    </View>
                  </View>
                  
                  {/* Dispatch Status */}
                  <View>
                    <Text className="text-gray-600 text-xs mb-2">Dispatch Status</Text>
                    <View className="border border-gray-300 rounded-md bg-white">
                      <Picker
                        selectedValue={order.dispatch_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'dispatch_status', value, order)}
                        style={{ height: 50, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Dispatch Status" value="" />
                        <Picker.Item label="Partial" value="Partial" />
                        <Picker.Item label="Completed" value="Completed" />
                      </Picker>
                    </View>
                  </View>
                  
                  {/* Production Unit */}
                  <View>
                    <Text className="text-gray-600 text-xs mb-2">Production Unit</Text>
                    <View className="border border-gray-300 rounded-md bg-white">
                      <Picker
                        selectedValue={order.production_unit || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_unit', value, order)}
                        style={{ height: 50, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Production Unit" value="" />
                        <Picker.Item label="Boisar" value="Boisar" />
                        <Picker.Item label="Ranchi" value="Ranchi" />
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Action Buttons Section */}
                <View className="space-y-3">
                  <Text className="text-primary-950 font-bold text-sm">Quick Actions</Text>
                  
                  {/* Primary Actions Row */}
                  <View className="flex-row space-x-2">
                    <Pressable
                      onPress={() => navigateToPage(order, 'address')}
                      className="flex-1 bg-secondary py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="location" size={18} color="#0a0a0a" />
                      <Text className="text-primary-950 font-bold ml-2">Address</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => navigateToPage(order, 'kits')}
                      className="flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="cube" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Kits</Text>
                    </Pressable>
                  </View>
                  
                  {/* Secondary Actions Row */}
                  <View className="flex-row space-x-2">
                    <Pressable
                      onPress={() => navigateToPage(order, 'dispatch_lots')}
                      className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="send" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Dispatch</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => navigateToPage(order, 'qc_docs')}
                      className="flex-1 bg-purple-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="shield-checkmark" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">QC Docs</Text>
                    </Pressable>
                  </View>
                  
                  {/* Document Action */}
                  <Pressable
                    onPress={() => navigateToPage(order, 'dispatch_docs')}
                    className="bg-orange-500 py-3 rounded-lg flex-row items-center justify-center"
                  >
                    <Ionicons name="document-text" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Dispatch Documents</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {currentOrders.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center mx-2 mt-8">
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-xl font-bold mt-4">
                No orders found
              </Text>
              <Text className="text-gray-400 text-center mt-2 text-base">
                {searchQuery ? 'Try adjusting your search criteria' : totalOrders > 0 ? `No orders on page ${currentPage}` : 'No confirmed orders available'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <View className="mt-4 flex-row justify-between items-center">
            <Pressable
              onPress={goToPrevPage}
              disabled={currentPage === 1}
              className={`flex-row items-center px-6 py-3 rounded-lg ${
                currentPage === 1 ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={currentPage === 1 ? '#9CA3AF' : '#0a0a0a'} 
              />
              <Text className={`ml-2 font-semibold text-base ${
                currentPage === 1 ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Previous
              </Text>
            </Pressable>
            
            <View className="bg-primary-950 px-4 py-2 rounded-lg">
              <Text className="text-secondary font-bold text-lg">
                {currentPage} / {totalPages}
              </Text>
            </View>
            
            <Pressable
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              className={`flex-row items-center px-6 py-3 rounded-lg ${
                currentPage === totalPages ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Text className={`mr-2 font-semibold text-base ${
                currentPage === totalPages ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Next
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={currentPage === totalPages ? '#9CA3AF' : '#0a0a0a'} 
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}