import "../../global.css";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { enquiryAPI } from '@/services/api';
import { useRouter } from 'expo-router';

const kitNames = [
  "2P×3, 10°, 6.2 FT",
  "2P×3, 10°, 8.2 FT", 
  "2P×5, 10°, 6.2 FT",
  "2P×5, 10°, 8.2 FT",
  "2P×3, 15°, 6.2 FT",
  "2P×3, 15°, 8.2 FT",
  "2P×5, 15°, 6.2 FT",
  "2P×5, 15°, 8.2 FT"
];

export default function CreateEnquiry() {
  const router = useRouter();
  const [customerType, setCustomerType] = useState('New');
  const [customerName, setCustomerName] = useState('');
  const [selectedExistingClient, setSelectedExistingClient] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [poDate, setPoDate] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [paymentPercent, setPaymentPercent] = useState('');
  const [quantities, setQuantities] = useState(Array(8).fill(''));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [partialDelivery, setPartialDelivery] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingClients, setExistingClients] = useState([]);

  const totalKits = quantities.reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  useEffect(() => {
    fetchExistingClients();
  }, []);

  const fetchExistingClients = async () => {
    try {
      const enquiries = await enquiryAPI.getAll();
      const uniqueClients = enquiries
        .map((enquiry: any) => enquiry.client_name)
        .filter((name: string) => name && name.trim() !== '')
        .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)
        .sort();
      setExistingClients(uniqueClients);
    } catch (error) {
      console.error('Error fetching existing clients:', error);
    }
  };

  const RadioButton = ({ selected, onPress, label }: any) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center mr-6 mb-2"
    >
      <View className={`w-5 h-5 rounded-full border-2 mr-2 ${
        selected ? 'bg-secondary-DEFAULT border-secondary-DEFAULT' : 'border-gray-400'
      }`}>
        {selected && (
          <View className="w-full h-full rounded-full bg-primary-950 m-0.5" />
        )}
      </View>
      <Text className="text-gray-700 font-medium">{label}</Text>
    </Pressable>
  );

  const handleSubmit = async () => {
    // Validation
    if (!customerName || !deliveryAddress || !billingAddress || !poDate || 
        !paymentReceived || !deliveryDate || !partialDelivery) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (paymentReceived === 'Partial' && !paymentPercent) {
      Alert.alert('Error', 'Please enter payment percentage.');
      return;
    }

    if (quantities.every(q => !q || parseInt(q) <= 0)) {
      Alert.alert('Error', 'Please enter at least one kit quantity.');
      return;
    }

    setLoading(true);

    try {
      const enquiryData = {
        client_name: customerName,
        delivery_address: deliveryAddress,
        billing_address: billingAddress,
        po_date_str: poDate,
        payment_received: paymentReceived,
        payment_percentage: paymentPercent,
        kit1_name: kitNames[0],
        kit1_qty: quantities[0] || '0',
        kit2_name: kitNames[1],
        kit2_qty: quantities[1] || '0',
        kit3_name: kitNames[2],
        kit3_qty: quantities[2] || '0',
        kit4_name: kitNames[3],
        kit4_qty: quantities[3] || '0',
        kit5_name: kitNames[4],
        kit5_qty: quantities[4] || '0',
        kit6_name: kitNames[5],
        kit6_qty: quantities[5] || '0',
        kit7_name: kitNames[6],
        kit7_qty: quantities[6] || '0',
        kit8_name: kitNames[7],
        kit8_qty: quantities[7] || '0',
        total_kits: totalKits.toString(),
        delivery_date_str: deliveryDate,
        partial_delivery_allowed: partialDelivery,
        remarks: remarks,
      };

      await enquiryAPI.create(enquiryData);
      
      Alert.alert(
        'Success', 
        'Sales Order Created Successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating enquiry:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to create sales order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset all fields
    setCustomerName('');
    setDeliveryAddress('');
    setBillingAddress('');
    setPoDate('');
    setPaymentReceived('');
    setPaymentPercent('');
    setQuantities(Array(8).fill(''));
    setDeliveryDate('');
    setPartialDelivery('');
    setRemarks('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* <View className="bg-primary-950 px-6 py-6">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add-circle" size={28} color="#FAD90E" />
            <Text className="text-secondary-DEFAULT text-xl font-bold ml-3">
              Create Sales Order
            </Text>
          </View>
        </View> */}

        <View className="p-6 space-y-6">
          {/* Customer Type */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Customer Type
            </Text>
            <View className="flex-row">
              <RadioButton
                selected={customerType === 'New'}
                onPress={() => setCustomerType('New')}
                label="New"
              />
              <RadioButton
                selected={customerType === 'Old'}
                onPress={() => setCustomerType('Old')}
                label="Old"
              />
            </View>
          </View>

          {/* Customer Name */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Customer Name *
            </Text>
            {customerType === 'Old' ? (
              <View className="bg-white border border-gray-300 rounded-lg">
                <Picker
                  selectedValue={selectedExistingClient}
                  onValueChange={(value) => {
                    setSelectedExistingClient(value);
                    setCustomerName(value);
                  }}
                  style={{ color: '#374151' }}
                >
                  <Picker.Item label="Select existing client" value="" />
                  {existingClients.map((client: string, index: number) => (
                    <Picker.Item key={index} label={client} value={client} />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
                placeholderTextColor="#9CA3AF"
              />
            )}
          </View>

          {/* Delivery Address */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Delivery Address *
            </Text>
            <TextInput
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter delivery address"
              multiline
              numberOfLines={3}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>

          {/* Billing Address */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Billing Address *
            </Text>
            <TextInput
              value={billingAddress}
              onChangeText={setBillingAddress}
              placeholder="Enter billing address"
              multiline
              numberOfLines={3}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>

          {/* PO Date */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              PO Date *
            </Text>
            <TextInput
              value={poDate}
              onChangeText={setPoDate}
              placeholder="YYYY-MM-DD"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Payment Received */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Payment Received *
            </Text>
            <View className="flex-row flex-wrap">
              <RadioButton
                selected={paymentReceived === 'Yes'}
                onPress={() => setPaymentReceived('Yes')}
                label="Yes"
              />
              <RadioButton
                selected={paymentReceived === 'No'}
                onPress={() => setPaymentReceived('No')}
                label="No"
              />
              <RadioButton
                selected={paymentReceived === 'Partial'}
                onPress={() => setPaymentReceived('Partial')}
                label="Partial"
              />
            </View>
            {paymentReceived === 'Partial' && (
              <TextInput
                value={paymentPercent}
                onChangeText={setPaymentPercent}
                placeholder="Enter percentage"
                keyboardType="numeric"
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 mt-2"
                placeholderTextColor="#9CA3AF"
              />
            )}
          </View>

          {/* Kit and Quantity Table */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Kit and Quantity
            </Text>
            <View className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <View className="bg-primary-950 flex-row py-3">
                <Text className="text-secondary-DEFAULT font-bold text-center flex-1">S.N</Text>
                <Text className="text-secondary-DEFAULT font-bold text-center flex-2">Kit Name</Text>
                <Text className="text-secondary-DEFAULT font-bold text-center flex-1">Quantity</Text>
              </View>
              {kitNames.map((kitName, index) => (
                <View key={index} className="flex-row items-center py-3 border-b border-gray-200">
                  <Text className="text-primary-950 font-bold text-center flex-1">{index + 1}</Text>
                  <Text className="text-gray-700 text-center flex-2 px-2">{kitName}</Text>
                  <View className="flex-1 px-2">
                    <TextInput
                      value={quantities[index]}
                      onChangeText={(text) => {
                        const newQuantities = [...quantities];
                        newQuantities[index] = text;
                        setQuantities(newQuantities);
                      }}
                      placeholder="0"
                      keyboardType="numeric"
                      className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-2 text-center text-gray-700"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Total Kits */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Total No Of Kits
            </Text>
            <View className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
              <Text className="text-gray-700 font-bold">{totalKits}</Text>
            </View>
          </View>

          {/* Delivery Date */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Delivery Date *
            </Text>
            <TextInput
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Partial Delivery Allowed */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Partial Delivery Allowed *
            </Text>
            <View className="flex-row">
              <RadioButton
                selected={partialDelivery === 'Yes'}
                onPress={() => setPartialDelivery('Yes')}
                label="Yes"
              />
              <RadioButton
                selected={partialDelivery === 'No'}
                onPress={() => setPartialDelivery('No')}
                label="No"
              />
            </View>
          </View>

          {/* Remarks */}
          <View>
            <Text className="text-lg font-semibold text-primary-950 mb-3">
              Remarks
            </Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Any additional remarks..."
              multiline
              numberOfLines={3}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View className="flex-row justify-center space-x-4 mt-8">
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`px-8 py-4 rounded-xl flex-row items-center shadow-lg ${
                loading ? 'bg-gray-400' : 'bg-secondary-DEFAULT'
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#000000" />
              )}
              <Text className="text-primary-950 font-bold ml-2">
                {loading ? 'Creating...' : 'Submit'}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={handleCancel}
              disabled={loading}
              className={`px-8 py-4 rounded-xl flex-row items-center shadow-lg ${
                loading ? 'bg-gray-300' : 'bg-gray-500'
              }`}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}