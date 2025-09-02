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
  Modal,
  SafeAreaView,
  Platform,
  Linking
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, enquiryAPI, kitAPI, kitDispatchAPI, dispatchAPI, qcDocsAPI, dispatchDocsAPI, getApiUrl, API_CONFIG } from '@/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';
  
  switch (status.toLowerCase()) {
    case 'completed':
      bgColor = 'bg-green-500';
      break;
    case 'in production':
      bgColor = 'bg-secondary';
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
      bgColor = 'bg-secondary';
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

type Order = {
  id: string;
  sr?: string;
  project_id?: string;
  client_name?: string;
  production_status?: string;
  dispatch_status?: string;
  production_unit?: string;
  po_date_str?: string;
  delivery_date_str?: string;
  total_kits?: string;
  payment_received?: string;
  payment_percentage?: string;
  partial_delivery_allowed?: string;
  shipping_address?: string;
  billing_address?: string;
  order_value?: string;
  payment_status?: string;
  remarks?: string;
  kits?: Kit[];
  dispatch_lots?: DispatchLot[];
  qc_documents?: QCDocument[];
  dispatch_documents?: DispatchDocument[];
};

type Kit = {
  id: string;
  kit_name?: string;
  quantity?: number;
  dispatched_quantity?: number;
  pending_quantity?: number;
  specifications?: string;
};

type DispatchLot = {
  id: string;
  lot_number?: string;
  dispatch_date?: string;
  quantity?: number;
  status?: string;
  tracking_number?: string;
};

type QCDocument = {
  id: string;
  document_name?: string;
  file_url?: string;
  upload_date?: string;
};

type DispatchDocument = {
  id: string;
  document_name?: string;
  file_url?: string;
  upload_date?: string;
};

type ModalType = 'address' | 'kits' | 'dispatch_lots' | 'qc_docs' | 'dispatch_docs' | null;

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Modal-specific state to match Vue behavior
  const [kitsSummary, setKitsSummary] = useState<Array<{ name: string; qty: number; dispatched: number; pending: number }>>([]);
  const [kitsLots, setKitsLots] = useState<any[]>([]);
  const [lotInputs, setLotInputs] = useState<number[]>([]);
  const [dispatchLots, setDispatchLots] = useState<any[]>([]);
  const [newDispatchPct, setNewDispatchPct] = useState<string>('');
  const [qcFiles, setQcFiles] = useState<any[]>([]);
  const [dispatchDocs, setDispatchDocs] = useState<any[]>([]);
  const [qcDocName, setQcDocName] = useState('');
  const [dispatchDocName, setDispatchDocName] = useState('');

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
      // Try to get confirmed orders from different API endpoints
      let data;
      try {
        // First try to get user orders
        data = await orderAPI.getUserOrders();
        // console.log('Fetched from getUserOrders:', data);
      } catch (userOrdersError) {
        // console.log('getUserOrders failed, trying customer orders:', userOrdersError);
        try {
          // Try to get customer orders
          data = await orderAPI.getCustomerOrders();
          // console.log('Fetched from getCustomerOrders:', data);
        } catch (customerOrdersError) {
          // console.log('getCustomerOrders failed, trying all orders:', customerOrdersError);
          try {
            // Try to get all orders
            data = await orderAPI.getAll();
            // console.log('Fetched from getAll orders:', data);
          } catch (allOrdersError) {
            // console.log('getAll orders failed, trying enquiries:', allOrdersError);
            try {
              // As fallback, try enquiries (your original working endpoint that was working)
              data = await enquiryAPI.getAll();
              // console.log('Fetched from enquiries as fallback:', data);
            } catch (enquiriesError) {
              console.error('All API endpoints failed:', enquiriesError);
              throw enquiriesError;
            }
          }
        }
      }
      
      // console.log('Final fetched orders:', data);
      // console.log('Number of orders:', data?.length);
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      // Set empty arrays on error to prevent crashes
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
      // Prefer patching enquiry by SR, to match backend used by web app
      const sr = (order as any)?.sr;
      if (sr) {
        // Map UI fields to backend fields if necessary
        const payload: any = {};
        // Keep the field mapping consistent with web app
        payload[field] = value;
        await enquiryAPI.patchBySr(sr, payload);
      } else {
        // Fallback: update orders endpoint if SR missing
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

  const buildKitsFromOrder = (order: any) => {
    const kits: Array<{ name: string; qty: number }> = [];
    for (let i = 1; i <= 8; i++) {
      const name = order[`kit${i}_name`];
      const qtyRaw = order[`kit${i}_qty`];
      const qty = Number(qtyRaw) || 0;
      if (name && qty > 0) kits.push({ name, qty });
    }
    return kits;
  };

  const openModal = async (order: Order, type: ModalType) => {
    setSelectedOrder(order);
    setModalType(type);
    setModalVisible(true);

    try {
      const sr = (order as any)?.sr;
      if (type === 'kits') {
        const kits = buildKitsFromOrder(order);
        let lots: any[] = [];
        let dispatchedByKit: number[] = kits.map(() => 0);
        if (sr) {
          lots = await kitDispatchAPI.getBySr(sr);
          if (lots?.length) {
            const keys = Object.keys(lots[0]).filter((k) => k.startsWith('kit'));
            dispatchedByKit = keys.map((key) => lots.reduce((sum, item) => sum + (Number(item[key]) || 0), 0));
          }
        }
        const summary = kits.map((k, idx) => {
          const dispatched = dispatchedByKit[idx] || 0;
          const pending = Math.max((Number(k.qty) || 0) - dispatched, 0);
          return { name: k.name, qty: Number(k.qty) || 0, dispatched, pending };
        });
        setKitsSummary(summary);
        setKitsLots(lots || []);
        setLotInputs(summary.map(() => 0));
      }

      if (type === 'dispatch_lots' && sr) {
        const lots = await dispatchAPI.getBySr(sr);
        setDispatchLots(lots || []);
      }

      if (type === 'qc_docs' && sr) {
        const files = await qcDocsAPI.getBySr(sr);
        setQcFiles(files || []);
      }

      if (type === 'dispatch_docs' && sr) {
        const files = await dispatchDocsAPI.getBySr(sr);
        setDispatchDocs(files || []);
      }
    } catch (e) {
      console.log('Modal data fetch error:', e);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setSelectedOrder(null);
  };

  const handleFileUpload = async (documentType: 'qc' | 'dispatch') => {
    try {
      setUploadingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const sr = (selectedOrder as any)?.sr;
        if (!sr) throw new Error('No SR found for upload');
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name
        } as any);
        formData.append('file_name', documentType === 'qc' ? (qcDocName || file.name) : (dispatchDocName || file.name));
        formData.append('sr', sr);
        // Upload date as per web app
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const uploaded_at_str = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        formData.append('uploaded_at_str', uploaded_at_str);

        const token = await AsyncStorage.getItem('access_token');
        const url = documentType === 'qc' ? getApiUrl(API_CONFIG.ENDPOINTS.QC_DOCS) : getApiUrl(API_CONFIG.ENDPOINTS.DISPATCH_DOCS);
        const response = await fetch(url, {
          method: 'POST',
          body: formData as any,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          Alert.alert('Success', 'Document uploaded successfully!');
          if (documentType === 'qc') {
            setQcFiles(await qcDocsAPI.getBySr(sr));
          } else {
            setDispatchDocs(await dispatchDocsAPI.getBySr(sr));
          }
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const formatNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const handleFileDownload = async (fileUrl: string, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(fileUrl);
      } else {
        const downloadDir = FileSystem.documentDirectory + fileName;
        const { uri } = await FileSystem.downloadAsync(fileUrl, downloadDir);
        Alert.alert('Success', `File downloaded to: ${uri}`);
      }
    } catch (error) {
      console.error('File download error:', error);
      Alert.alert('Error', 'Failed to download file.');
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

        {/* Order Count */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-primary-950">
            Total Orders: {filteredOrders.length}
          </Text>
        </View>

        {/* Orders Cards */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {filteredOrders.map((order, index) => (
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
                  <Text className="text-primary-950 font-bold text-sm">#{index + 1}</Text>
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
                        style={{ height: 45, color: '#0a0a0a' }}
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
                        style={{ height: 45, color: '#0a0a0a' }}
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
                        style={{ height: 45, color: '#0a0a0a' }}
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
                      onPress={() => openModal(order, 'address')}
                      className="flex-1 bg-secondary py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="location" size={18} color="#0a0a0a" />
                      <Text className="text-primary-950 font-bold ml-2">Address</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'kits')}
                      className="flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="cube" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Kits</Text>
                    </Pressable>
                  </View>
                  
                  {/* Secondary Actions Row */}
                  <View className="flex-row space-x-2">
                    <Pressable
                      onPress={() => openModal(order, 'dispatch_lots')}
                      className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="send" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Dispatch</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'qc_docs')}
                      className="flex-1 bg-purple-500 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="shield-checkmark" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">QC Docs</Text>
                    </Pressable>
                  </View>
                  
                  {/* Document Action */}
                  <Pressable
                    onPress={() => openModal(order, 'dispatch_docs')}
                    className="bg-orange-500 py-3 rounded-lg flex-row items-center justify-center"
                  >
                    <Ionicons name="document-text" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Dispatch Documents</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {filteredOrders.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center mx-2 mt-8">
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-xl font-bold mt-4">
                No orders found
              </Text>
              <Text className="text-gray-400 text-center mt-2 text-base">
                {searchQuery ? 'Try adjusting your search criteria' : 'No confirmed orders available'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal Dialogs */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="bg-primary-950 px-4 py-4 flex-row justify-between items-center">
              <Text className="text-secondary text-xl font-bold">
                {modalType === 'address' && 'Address Details'}
                {modalType === 'kits' && 'Kit Specifications'}
                {modalType === 'dispatch_lots' && 'Dispatch Lots'}
                {modalType === 'qc_docs' && 'QC Documents'}
                {modalType === 'dispatch_docs' && 'Dispatch Documents'}
              </Text>
              <Pressable onPress={closeModal}>
                <Ionicons name="close" size={28} color="#FAD90E" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Address Modal */}
              {modalType === 'address' && selectedOrder && (
                <View className="space-y-4">
                  <View className="bg-white rounded-xl p-4 shadow-md">
                    <Text className="text-primary-950 text-lg font-bold mb-3">Order Information</Text>
                    <View className="space-y-2">
                      <View className="flex-row">
                        <Text className="text-gray-600 font-semibold w-24">Client:</Text>
                        <Text className="text-primary-950 flex-1">{selectedOrder.client_name || 'N/A'}</Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-gray-600 font-semibold w-24">Project ID:</Text>
                        <Text className="text-primary-950 flex-1">{selectedOrder.project_id || 'N/A'}</Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-gray-600 font-semibold w-24">Order Value:</Text>
                        <Text className="text-primary-950 flex-1">{selectedOrder.order_value || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="bg-white rounded-xl p-4 shadow-md">
                    <Text className="text-primary-950 text-lg font-bold mb-3">Shipping Address</Text>
                    <Text className="text-primary-950 leading-6">
                      {selectedOrder.shipping_address || 'No shipping address provided'}
                    </Text>
                  </View>

                  <View className="bg-white rounded-xl p-4 shadow-md">
                    <Text className="text-primary-950 text-lg font-bold mb-3">Billing Address</Text>
                    <Text className="text-primary-950 leading-6">
                      {selectedOrder.billing_address || 'No billing address provided'}
                    </Text>
                  </View>

                  {selectedOrder.remarks && (
                    <View className="bg-white rounded-xl p-4 shadow-md">
                      <Text className="text-primary-950 text-lg font-bold mb-3">Remarks</Text>
                      <Text className="text-primary-950 leading-6">{selectedOrder.remarks}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Kits Modal - built from enquiry fields + kitdispatch lots */}
              {modalType === 'kits' && selectedOrder && (
                <View className="space-y-4">
                  <Text className="text-primary-950 text-lg font-bold">Kits for {selectedOrder.client_name} ({selectedOrder.project_id})</Text>

                  {kitsSummary.length > 0 ? (
                    kitsSummary.map((kit, index) => (
                      <View key={`${kit.name}-${index}`} className="bg-white rounded-xl p-4 shadow-md">
                        <Text className="text-primary-950 font-bold text-lg mb-2">{kit.name}</Text>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Total Quantity:</Text>
                          <Text className="text-primary-950 font-semibold">{kit.qty}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-gray-600">Dispatched:</Text>
                          <Text className="text-green-600 font-semibold">{kit.dispatched}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-gray-600">Pending:</Text>
                          <Text className="text-red-600 font-semibold">{kit.pending}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-8 items-center">
                      <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4">No kits available</Text>
                    </View>
                  )}

                  {/* Previous dispatch lots summary */}
                  {kitsLots?.length > 0 && (
                    <View className="bg-white rounded-xl p-4 shadow-md">
                      <Text className="text-primary-950 font-bold text-base mb-2">Previous Lots</Text>
                      {kitsLots.map((lot, idx) => (
                        <View key={idx} className="flex-row justify-between py-1 border-b border-gray-200">
                          <Text className="text-gray-700">Lot {idx + 1}</Text>
                          <Text className="text-gray-700">Sum: {lot.sum || 0}</Text>
                          <Text className="text-gray-700">Date: {lot.delivery_date || lot.delivery_date_str || '-'}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              

              {/* QC Documents Modal */}
              {modalType === 'qc_docs' && selectedOrder && (
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary-950 text-lg font-bold">QC Documents</Text>
                    <Pressable
                      onPress={() => handleFileUpload('qc')}
                      className="bg-secondary px-4 py-2 rounded-lg flex-row items-center"
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <ActivityIndicator size="small" color="#0a0a0a" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload" size={20} color="#0a0a0a" />
                          <Text className="text-primary-950 font-bold ml-2">Upload</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                  
                  {qcFiles && qcFiles.length > 0 ? (
                    qcFiles.map((doc: any) => (
                      <View key={doc.id} className="bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-primary-950 font-bold">{doc.file_name || doc.document_name}</Text>
                            <Text className="text-gray-600 text-sm">Uploaded: {doc.uploaded_at_str || doc.upload_date}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleFileDownload(doc.file || doc.file_url || '', doc.file_name || doc.document_name || 'document')}
                            className="bg-blue-500 px-3 py-2 rounded-lg"
                          >
                            <Ionicons name="download" size={16} color="white" />
                          </Pressable>
                        </View>
                        <View className="flex-row justify-end mt-2">
                          <Pressable
                            onPress={async () => { await qcDocsAPI.patch(String(doc.id), { deleted: 'Yes' }); const sr = (selectedOrder as any)?.sr; if (sr) setQcFiles(await qcDocsAPI.getBySr(sr)); }}
                            className="bg-red-500 px-3 py-1 rounded-lg"
                          >
                            <Text className="text-white">Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-8 items-center">
                      <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4">No QC documents uploaded</Text>
                    </View>
                  )}

                  {/* Upload name field */}
                  <View>
                    <Text className="text-gray-700 text-sm mb-1">Name of Document</Text>
                    <TextInput
                      value={qcDocName}
                      onChangeText={setQcDocName}
                      placeholder="e.g., Invoice"
                      className="border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}

              {/* Dispatch Documents Modal */}
              {modalType === 'dispatch_docs' && selectedOrder && (
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary-950 text-lg font-bold">Dispatch Documents</Text>
                    <Pressable
                      onPress={() => handleFileUpload('dispatch')}
                      className="bg-secondary px-4 py-2 rounded-lg flex-row items-center"
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <ActivityIndicator size="small" color="#0a0a0a" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload" size={20} color="#0a0a0a" />
                          <Text className="text-primary-950 font-bold ml-2">Upload</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                  
                  {dispatchDocs && dispatchDocs.length > 0 ? (
                    dispatchDocs.map((doc: any) => (
                      <View key={doc.id} className="bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-primary-950 font-bold">{doc.file_name || doc.document_name}</Text>
                            <Text className="text-gray-600 text-sm">Uploaded: {doc.uploaded_at_str || doc.upload_date}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleFileDownload(doc.file || doc.file_url || '', doc.file_name || doc.document_name || 'document')}
                            className="bg-blue-500 px-3 py-2 rounded-lg"
                          >
                            <Ionicons name="download" size={16} color="white" />
                          </Pressable>
                        </View>
                        <View className="flex-row justify-end mt-2">
                          <Pressable
                            onPress={async () => { await dispatchDocsAPI.patch(String(doc.id), { deleted: 'Yes' }); const sr = (selectedOrder as any)?.sr; if (sr) setDispatchDocs(await dispatchDocsAPI.getBySr(sr)); }}
                            className="bg-red-500 px-3 py-1 rounded-lg"
                          >
                            <Text className="text-white">Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-8 items-center">
                      <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4">No dispatch documents uploaded</Text>
                    </View>
                  )}

                  {/* Upload name field */}
                  <View>
                    <Text className="text-gray-700 text-sm mb-1">Name of Document</Text>
                    <TextInput
                      value={dispatchDocName}
                      onChangeText={setDispatchDocName}
                      placeholder="e.g., LR Copy"
                      className="border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}
              {/* Dispatch Lots Modal */}
              {modalType === 'dispatch_lots' && selectedOrder && (
                <View className="space-y-4">
                  <Text className="text-primary-950 text-lg font-bold">Dispatch Lots for {selectedOrder.project_id}</Text>

                  {/* Existing lots */}
                  {dispatchLots && dispatchLots.length > 0 ? (
                    dispatchLots.map((lot: any, idx: number) => (
                      <View key={lot.id || idx} className="bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between">
                          <Text className="text-gray-700">Lot #{lot.lot_number || idx + 1}</Text>
                          <Text className="text-gray-700">{lot.percentage}%</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-gray-600">Date:</Text>
                          <Text className="text-primary-950">{lot.lot_date_str || lot.delivery_date_str || '-'}</Text>
                        </View>
                        {lot.deleted === 'Yes' ? (
                          <Text className="text-red-600 mt-2">Deleted</Text>
                        ) : (
                          <View className="flex-row justify-end mt-3">
                            <Pressable
                              onPress={async () => { await dispatchAPI.patch(lot.id, { deleted: 'Yes' }); const sr = (selectedOrder as any)?.sr; if (sr) setDispatchLots(await dispatchAPI.getBySr(sr)); }}
                              className="bg-red-500 px-3 py-2 rounded-lg"
                            >
                              <Text className="text-white font-semibold">Delete</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-4 items-center">
                      <Ionicons name="list" size={28} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-2">No lots yet</Text>
                    </View>
                  )}

                  {/* Add new lot */}
                  <View className="bg-white rounded-xl p-4 shadow-md">
                    <Text className="text-primary-950 font-bold mb-2">Add Lot Percentage</Text>
                    <TextInput
                      value={newDispatchPct}
                      onChangeText={setNewDispatchPct}
                      placeholder="Enter percentage (1-100)"
                      keyboardType="numeric"
                      className="border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Pressable
                      onPress={async () => {
                        const sr = (selectedOrder as any)?.sr;
                        if (!sr) return;
                        const pct = Number(newDispatchPct);
                        if (!pct || pct < 1 || pct > 100) { Alert.alert('Invalid', 'Enter 1-100'); return; }
                        const nonDeleted = (dispatchLots || []).filter((l: any) => l.deleted !== 'Yes');
                        const total = nonDeleted.reduce((s: number, l: any) => s + Number(l.percentage || 0), 0);
                        if (total + pct > 100) { Alert.alert('Invalid', `Total cannot exceed 100%. Current: ${total}%`); return; }
                        const lot_number = (dispatchLots?.length || 0) + 1;
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const lot_date_str = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                        await dispatchAPI.create({ sr, lot_number, percentage: pct, deleted: 'No', lot_date_str });
                        setNewDispatchPct('');
                        setDispatchLots(await dispatchAPI.getBySr(sr));
                      }}
                      className="mt-3 bg-green-500 px-4 py-2 rounded-lg items-center"
                    >
                      <Text className="text-white font-semibold">Save Lot</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {/* Add Lot for Kits */}
              {modalType === 'kits' && selectedOrder && kitsSummary.length > 0 && (
                <View className="bg-white rounded-xl p-4 shadow-md mt-2">
                  <Text className="text-primary-950 font-bold mb-2">Add Dispatch Lot</Text>
                  {kitsSummary.map((kit, idx) => (
                    <View key={`input-${idx}`} className="flex-row justify-between items-center py-1">
                      <Text className="text-gray-700 flex-1 mr-2">{kit.name}</Text>
                      <Text className="text-gray-500 mr-2 text-xs">Max {kit.pending}</Text>
                      <TextInput
                        value={String(lotInputs[idx] ?? 0)}
                        onChangeText={(t) => {
                          const val = Math.max(0, Math.min(Number(t) || 0, kit.pending));
                          setLotInputs((prev) => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        keyboardType="numeric"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center text-gray-700"
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  ))}
                  <Pressable
                    onPress={async () => {
                      const sr = (selectedOrder as any)?.sr;
                      if (!sr) return;
                      const totalSum = (lotInputs || []).reduce((a, b) => a + (Number(b) || 0), 0);
                      if (totalSum <= 0) { Alert.alert('Invalid', 'Enter at least one quantity'); return; }
                      const payload: any = { sr, sum: totalSum, delivery_date: formatNow() };
                      for (let i = 0; i < kitsSummary.length; i++) {
                        payload[`kit${i+1}_dispatched`] = lotInputs[i] || 0;
                      }
                      await kitDispatchAPI.create(payload);
                      const lots = await kitDispatchAPI.getBySr(sr);
                      setKitsLots(lots || []);
                      // Refresh summary
                      let dispatchedByKit: number[] = kitsSummary.map(() => 0);
                      if (lots?.length) {
                        const keys = Object.keys(lots[0]).filter((k) => k.startsWith('kit'));
                        dispatchedByKit = keys.map((key) => lots.reduce((sum, item) => sum + (Number(item[key]) || 0), 0));
                      }
                      setKitsSummary((prev) => prev.map((k, idx) => ({ ...k, dispatched: dispatchedByKit[idx] || 0, pending: Math.max(k.qty - (dispatchedByKit[idx] || 0), 0) })));
                      setLotInputs(kitsSummary.map(() => 0));
                      Alert.alert('Success', 'Lot saved successfully!');
                    }}
                    className="mt-3 bg-blue-500 px-4 py-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-semibold">Save Lot</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
