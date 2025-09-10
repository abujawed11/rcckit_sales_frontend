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

// Utility function to format dates consistently
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not available';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Reset to first page and fetch when search changes
    setCurrentPage(1);
    fetchOrders(1, searchQuery);
  }, [searchQuery]);

  const fetchOrders = async (page: number = currentPage, search: string = '') => {
    try {
      setLoading(true);
      
      // Build search parameters for API
      const params: any = {
        page,
        page_size: ordersPerPage,
        ordering: '-created_at' // Latest first
      };
      
      // Add search filters if provided
      if (search.trim()) {
        params.client_name = search;
      }
      
      let data;
      try {
        // Use enquiry API with pagination - this has created_at field
        data = await enquiryAPI.getAll(params);
        
      } catch (enquiryError) {
        console.error('Enquiry API failed, trying fallback:', enquiryError);
        // Fallback to other APIs if needed
        try {
          data = await orderAPI.getUserOrders();
        } catch (userOrdersError) {
          try {
            data = await orderAPI.getCustomerOrders();
          } catch (customerOrdersError) {
            try {
              data = await orderAPI.getAll();
            } catch (allOrdersError) {
              throw new Error('All API endpoints failed');
            }
          }
        }
      }
      
      // Handle pagination response
      if (data && typeof data === 'object' && 'results' in data) {
        // Server-side paginated response
        setOrders(data.results || []);
        setTotalOrders(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / ordersPerPage));
        setHasNext(!!data.next);
        setHasPrevious(!!data.previous);
      } else {
        // Non-paginated response (fallback)
        setOrders(data || []);
        setTotalOrders((data || []).length);
        setTotalPages(1);
        setHasNext(false);
        setHasPrevious(false);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      setOrders([]);
      setTotalOrders(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrevious(false);
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
      const orderDbId = (order as any)?.id;
      
      console.log('=== Status Update Debug ===');
      console.log('Order ID:', orderId);
      console.log('Order DB ID:', orderDbId);
      console.log('Field:', field);
      console.log('Value:', value);
      console.log('SR:', sr);
      console.log('Full Order Object:', order);
      console.log('==========================');
      
      if (orderDbId) {
        // Use the database ID directly for faster updates
        const payload: any = {};
        payload[field] = value;
        console.log('Using enquiryAPI.patchById with ID:', orderDbId, 'payload:', payload);
        const response = await enquiryAPI.patchById(orderDbId, payload);
        console.log('Update response:', response);
      } else if (sr) {
        // Fallback to SR-based lookup
        const payload: any = {};
        payload[field] = value;
        console.log('Using enquiryAPI.patchBySr with payload:', payload);
        const response = await enquiryAPI.patchBySr(sr, payload);
        console.log('Update response:', response);
      } else {
        console.log('No SR or DB ID found, using orderAPI.update');
        const updatePayload: any = {};
        updatePayload[field] = value;
        await orderAPI.update(orderId, updatePayload);
      }
      await fetchOrders();
      Alert.alert('Success', 'Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to update status: ${error.response?.data?.message || error.message}`);
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

  // Server-side pagination - no client-side calculation needed
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = Math.min(startIndex + ordersPerPage, totalOrders);

  const goToNextPage = () => {
    if (hasNext && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchOrders(nextPage, searchQuery);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevious && currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchOrders(prevPage, searchQuery);
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
        {/* {totalPages > 1 && (
          <View className="mb-4 flex-row justify-center items-center space-x-4">
            <Pressable
              onPress={goToPrevPage}
              disabled={!hasPrevious}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                !hasPrevious ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={!hasPrevious ? '#9CA3AF' : '#0a0a0a'} 
              />
              <Text className={`ml-1 font-semibold ${
                !hasPrevious ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Previous
              </Text>
            </Pressable>
            
            <Text className="text-primary-950 font-bold text-lg">
              {currentPage}
            </Text>
            
            <Pressable
              onPress={goToNextPage}
              disabled={!hasNext}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                !hasNext ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Text className={`mr-1 font-semibold ${
                !hasNext ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Next
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={!hasNext ? '#9CA3AF' : '#0a0a0a'} 
              />
            </Pressable>
          </View>
        )} */}

        {/* Orders Cards */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {orders.map((order, index) => (
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
                      {formatDate(order.created_at || order.po_date_str)}
                    </Text>
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-xs mb-1">PO Date</Text>
                    <Text className="text-primary-950 text-sm">
                      {formatDate(order.po_date_str)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs mb-1">Delivery Date</Text>
                    <Text className="text-primary-950 text-sm">
                      {formatDate(order.delivery_date_str)}
                    </Text>
                  </View>
                </View>

                {/* Status Management Section */}
                <View className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <Text className="text-primary-950 font-bold text-sm mb-2">Status Management</Text>
                  
                  {/* Production Status */}
                  <View>
                    <Text className="text-gray-600 text-xs mb-2">Production Status</Text>
                    <View className={`border rounded-md ${
                      order.production_status === 'Planned' 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : order.production_status === 'WIP'
                        ? 'border-blue-300 bg-blue-50'
                        : order.production_status === 'Done'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      <Picker
                        selectedValue={order.production_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_status', value, order)}
                        style={{ 
                          height: 50, 
                          color: order.production_status === 'Planned' 
                            ? '#92400e' 
                            : order.production_status === 'WIP'
                            ? '#1e40af'
                            : order.production_status === 'Done'
                            ? '#166534'
                            : '#0a0a0a'
                        }}
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
                    <View className={`border rounded-md ${
                      order.dispatch_status === 'Partial' 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : order.dispatch_status === 'Completed'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      <Picker
                        selectedValue={order.dispatch_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'dispatch_status', value, order)}
                        style={{ 
                          height: 50, 
                          color: order.dispatch_status === 'Partial' 
                            ? '#92400e' 
                            : order.dispatch_status === 'Completed'
                            ? '#166534'
                            : '#0a0a0a'
                        }}
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
                    <View className={`border rounded-md ${
                      order.production_unit === 'Boisar' 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : order.production_unit === 'Ranchi'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}>
                      <Picker
                        selectedValue={order.production_unit || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_unit', value, order)}
                        style={{ 
                          height: 50, 
                          color: order.production_unit === 'Boisar' 
                            ? '#92400e' 
                            : order.production_unit === 'Ranchi'
                            ? '#166534'
                            : '#0a0a0a'
                        }}
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

          {orders.length === 0 && (
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
              disabled={!hasPrevious}
              className={`flex-row items-center px-6 py-3 rounded-lg ${
                !hasPrevious ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={!hasPrevious ? '#9CA3AF' : '#0a0a0a'} 
              />
              <Text className={`ml-2 font-semibold text-base ${
                !hasPrevious ? 'text-gray-400' : 'text-primary-950'
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
              disabled={!hasNext}
              className={`flex-row items-center px-6 py-3 rounded-lg ${
                !hasNext ? 'bg-gray-200' : 'bg-secondary'
              }`}
            >
              <Text className={`mr-2 font-semibold text-base ${
                !hasNext ? 'text-gray-400' : 'text-primary-950'
              }`}>
                Next
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={!hasNext ? '#9CA3AF' : '#0a0a0a'} 
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}