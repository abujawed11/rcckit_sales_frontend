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
import { enquiryAPI, orderAPI, kitAPI, getApiUrl, API_CONFIG } from '@/services/api';
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

type Order = {
  id: string;
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

  const handleStatusUpdate = async (orderId: string, field: string, value: string) => {
    try {
      setLoading(true);
      await orderAPI.update(orderId, { [field]: value });
      await fetchOrders();
      Alert.alert('Success', 'Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (order: Order, type: ModalType) => {
    setSelectedOrder(order);
    setModalType(type);
    setModalVisible(true);
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
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name
        } as any);
        formData.append('order_id', selectedOrder?.id || '');
        formData.append('document_type', documentType);

        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(getApiUrl('upload-document/'), {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          Alert.alert('Success', 'Document uploaded successfully!');
          await fetchOrders();
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

        {/* Orders Table */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="bg-white rounded-xl shadow-md overflow-hidden min-w-[1200px]">
            {/* Table Header */}
            <View className="bg-primary-950 flex-row py-4 px-2">
              <Text className="text-secondary-DEFAULT font-bold text-center w-12">S.N</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-32">Client</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-28">Project ID</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-24">Order Value</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-28">Payment Status</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-32">Production Status</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-32">Dispatch Status</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-28">Production Unit</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-24">PO Date</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-28">Delivery Date</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-20">Kits</Text>
              <Text className="text-secondary-DEFAULT font-bold text-center w-40">Actions</Text>
            </View>

            {/* Table Body */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {filteredOrders.map((order, index) => (
                <View key={order.id} className={`flex-row py-3 px-2 border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  {/* S.N */}
                  <Text className="text-primary-950 text-center w-12 text-sm font-medium">{index + 1}</Text>
                  
                  {/* Client */}
                  <Text className="text-primary-950 text-center w-32 text-sm font-medium" numberOfLines={2}>
                    {order.client_name || 'N/A'}
                  </Text>
                  
                  {/* Project ID */}
                  <Text className="text-primary-950 text-center w-28 text-sm font-bold" numberOfLines={1}>
                    {order.project_id || 'N/A'}
                  </Text>
                  
                  {/* Order Value */}
                  <Text className="text-primary-950 text-center w-24 text-sm font-medium">
                    {order.order_value || 'N/A'}
                  </Text>
                  
                  {/* Payment Status */}
                  <View className="w-28 items-center">
                    <PaymentBadge 
                      paymentReceived={order.payment_received || 'No'}
                      percentage={order.payment_percentage || '0'}
                    />
                  </View>
                  
                  {/* Production Status */}
                  <View className="w-32 px-1">
                    <View className="border border-gray-300 rounded-md">
                      <Picker
                        selectedValue={order.production_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_status', value)}
                        style={{ height: 35, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Status" value="" />
                        <Picker.Item label="Pending" value="Pending" />
                        <Picker.Item label="In Production" value="In Production" />
                        <Picker.Item label="Quality Check" value="Quality Check" />
                        <Picker.Item label="Completed" value="Completed" />
                        <Picker.Item label="On Hold" value="On Hold" />
                      </Picker>
                    </View>
                  </View>
                  
                  {/* Dispatch Status */}
                  <View className="w-32 px-1">
                    <View className="border border-gray-300 rounded-md">
                      <Picker
                        selectedValue={order.dispatch_status || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'dispatch_status', value)}
                        style={{ height: 35, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Status" value="" />
                        <Picker.Item label="Not Dispatched" value="Not Dispatched" />
                        <Picker.Item label="Partially Dispatched" value="Partially Dispatched" />
                        <Picker.Item label="Dispatched" value="Dispatched" />
                        <Picker.Item label="Delivered" value="Delivered" />
                      </Picker>
                    </View>
                  </View>
                  
                  {/* Production Unit */}
                  <View className="w-28 px-1">
                    <View className="border border-gray-300 rounded-md">
                      <Picker
                        selectedValue={order.production_unit || ''}
                        onValueChange={(value) => handleStatusUpdate(order.id, 'production_unit', value)}
                        style={{ height: 35, color: '#0a0a0a' }}
                        dropdownIconColor="#FAD90E"
                      >
                        <Picker.Item label="Select Unit" value="" />
                        <Picker.Item label="Unit 1" value="Unit 1" />
                        <Picker.Item label="Unit 2" value="Unit 2" />
                        <Picker.Item label="Unit 3" value="Unit 3" />
                        <Picker.Item label="Outsourced" value="Outsourced" />
                      </Picker>
                    </View>
                  </View>
                  
                  {/* PO Date */}
                  <Text className="text-primary-950 text-center w-24 text-xs" numberOfLines={2}>
                    {order.po_date_str || 'N/A'}
                  </Text>
                  
                  {/* Delivery Date */}
                  <Text className="text-primary-950 text-center w-28 text-xs" numberOfLines={2}>
                    {order.delivery_date_str || 'N/A'}
                  </Text>
                  
                  {/* Kits */}
                  <Text className="text-primary-950 text-center w-20 text-sm font-bold">
                    {order.total_kits || '0'}
                  </Text>
                  
                  {/* Actions */}
                  <View className="w-40 flex-row justify-center flex-wrap gap-1">
                    <Pressable
                      onPress={() => openModal(order, 'address')}
                      className="bg-secondary-DEFAULT px-2 py-1 rounded-md m-0.5"
                    >
                      <Text className="text-primary-950 text-xs font-bold">Address</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'kits')}
                      className="bg-blue-500 px-2 py-1 rounded-md m-0.5"
                    >
                      <Text className="text-white text-xs font-bold">Kits</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'dispatch_lots')}
                      className="bg-green-500 px-2 py-1 rounded-md m-0.5"
                    >
                      <Text className="text-white text-xs font-bold">Dispatch</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'qc_docs')}
                      className="bg-purple-500 px-2 py-1 rounded-md m-0.5"
                    >
                      <Text className="text-white text-xs font-bold">QC Docs</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => openModal(order, 'dispatch_docs')}
                      className="bg-orange-500 px-2 py-1 rounded-md m-0.5"
                    >
                      <Text className="text-white text-xs font-bold">Dispatch Docs</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {filteredOrders.length === 0 && (
                <View className="py-12 items-center">
                  <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg mt-4 font-semibold">
                    No orders found
                  </Text>
                  <Text className="text-gray-400 text-center mt-2">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No confirmed orders available'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
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
              <Text className="text-secondary-DEFAULT text-xl font-bold">
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

              {/* Kits Modal */}
              {modalType === 'kits' && selectedOrder && (
                <View className="space-y-4">
                  <Text className="text-primary-950 text-lg font-bold">Kit Specifications for {selectedOrder.project_id}</Text>
                  
                  {selectedOrder.kits && selectedOrder.kits.length > 0 ? (
                    selectedOrder.kits.map((kit, index) => (
                      <View key={kit.id} className="bg-white rounded-xl p-4 shadow-md">
                        <Text className="text-primary-950 font-bold text-lg mb-2">{kit.kit_name || `Kit ${index + 1}`}</Text>
                        <View className="space-y-2">
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Total Quantity:</Text>
                            <Text className="text-primary-950 font-semibold">{kit.quantity || 0}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Dispatched:</Text>
                            <Text className="text-green-600 font-semibold">{kit.dispatched_quantity || 0}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Pending:</Text>
                            <Text className="text-red-600 font-semibold">{kit.pending_quantity || 0}</Text>
                          </View>
                          {kit.specifications && (
                            <View className="mt-3 pt-3 border-t border-gray-200">
                              <Text className="text-gray-600 font-semibold mb-1">Specifications:</Text>
                              <Text className="text-primary-950">{kit.specifications}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-8 items-center">
                      <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4">No kits available</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Dispatch Lots Modal */}
              {modalType === 'dispatch_lots' && selectedOrder && (
                <View className="space-y-4">
                  <Text className="text-primary-950 text-lg font-bold">Dispatch Lots for {selectedOrder.project_id}</Text>
                  
                  {selectedOrder.dispatch_lots && selectedOrder.dispatch_lots.length > 0 ? (
                    selectedOrder.dispatch_lots.map((lot, index) => (
                      <View key={lot.id} className="bg-white rounded-xl p-4 shadow-md">
                        <Text className="text-primary-950 font-bold text-lg mb-2">Lot #{lot.lot_number || index + 1}</Text>
                        <View className="space-y-2">
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Dispatch Date:</Text>
                            <Text className="text-primary-950 font-semibold">{lot.dispatch_date || 'Not set'}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Quantity:</Text>
                            <Text className="text-primary-950 font-semibold">{lot.quantity || 0}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-gray-600">Status:</Text>
                            <StatusBadge status={lot.status || 'Unknown'} />
                          </View>
                          {lot.tracking_number && (
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600">Tracking Number:</Text>
                              <Text className="text-blue-600 font-semibold">{lot.tracking_number}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-xl p-8 items-center">
                      <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4">No dispatch lots available</Text>
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
                      className="bg-secondary-DEFAULT px-4 py-2 rounded-lg flex-row items-center"
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
                  
                  {selectedOrder.qc_documents && selectedOrder.qc_documents.length > 0 ? (
                    selectedOrder.qc_documents.map((doc) => (
                      <View key={doc.id} className="bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-primary-950 font-bold">{doc.document_name}</Text>
                            <Text className="text-gray-600 text-sm">Uploaded: {doc.upload_date}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleFileDownload(doc.file_url || '', doc.document_name || 'document')}
                            className="bg-blue-500 px-3 py-2 rounded-lg"
                          >
                            <Ionicons name="download" size={16} color="white" />
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
                </View>
              )}

              {/* Dispatch Documents Modal */}
              {modalType === 'dispatch_docs' && selectedOrder && (
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary-950 text-lg font-bold">Dispatch Documents</Text>
                    <Pressable
                      onPress={() => handleFileUpload('dispatch')}
                      className="bg-secondary-DEFAULT px-4 py-2 rounded-lg flex-row items-center"
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
                  
                  {selectedOrder.dispatch_documents && selectedOrder.dispatch_documents.length > 0 ? (
                    selectedOrder.dispatch_documents.map((doc) => (
                      <View key={doc.id} className="bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-primary-950 font-bold">{doc.document_name}</Text>
                            <Text className="text-gray-600 text-sm">Uploaded: {doc.upload_date}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleFileDownload(doc.file_url || '', doc.document_name || 'document')}
                            className="bg-blue-500 px-3 py-2 rounded-lg"
                          >
                            <Ionicons name="download" size={16} color="white" />
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
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}