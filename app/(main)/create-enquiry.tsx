import "../../global.css";
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { enquiryAPI } from '@/services/api';
import { useRouter } from 'expo-router';
import DateField from "@/components/DateField";

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
  const scrollRef = useRef<ScrollView>(null);
  const [datePicker, setDatePicker] = useState<{
    visible: boolean;
    target: 'po' | 'delivery' | null;
    year: number;
    month: number; // 1-12
    day: number;
  }>({ visible: false, target: null, year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() });


  const parseDateStr = (str: string) => {
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d] = m;
    return { year: +y, month: +mo, day: +d };
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

  const openDatePicker = (target: 'po' | 'delivery') => {
    const current = target === 'po' ? poDate : deliveryDate;
    const parsed = parseDateStr(current);
    const base = parsed ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
    setDatePicker({ visible: true, target, ...base });
  };

  const confirmDatePicker = () => {
    if (!datePicker.target) return;
    const { year, month, day, target } = datePicker;
    const pad = (n: number) => String(n).padStart(2, '0');
    const val = `${year}-${pad(month)}-${pad(day)}`;
    if (target === 'po') setPoDate(val);
    if (target === 'delivery') setDeliveryDate(val);
    setDatePicker((s) => ({ ...s, visible: false, target: null }));
  };

  const cancelDatePicker = () => setDatePicker((s) => ({ ...s, visible: false, target: null }));

  const handleFocusScroll = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
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
      const response = await enquiryAPI.getAll({ page_size: 1000 }); // Get more records for client names
      
      // Handle paginated response - check if response has 'results' field
      let enquiries;
      if (response && response.results && Array.isArray(response.results)) {
        enquiries = response.results;
      } else if (Array.isArray(response)) {
        // Fallback for non-paginated response
        enquiries = response;
      } else {
        console.warn('Unexpected API response format in CreateEnquiry:', response);
        enquiries = [];
      }
      
      const uniqueClients = enquiries
        .map((enquiry: any) => enquiry.client_name)
        .filter((name: string) => name && name.trim() !== '')
        .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)
        .sort();
      setExistingClients(uniqueClients);
    } catch (error) {
      console.error('Error fetching existing clients:', error);
      setExistingClients([]);
    }
  };

  const RadioButton = ({ selected, onPress, label }: any) => (
    <Pressable onPress={onPress} className="flex-row items-center mr-6 mb-2">
      <View
        className={`w-5 h-5 rounded-full border-2 mr-2 items-center justify-center ${selected ? 'border-secondary' : 'border-gray-500'
          }`}
      >
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-secondary" />}
      </View>
      <Text className="text-gray-200 font-medium">{label}</Text>
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
    <View className="flex-1 bg-primary-950">
      {/* <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: 120 }}
      > */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            // padding: THEME.spacing[5],
            // paddingBottom: 40,
            paddingTop: 20,
            flexGrow: 1,
            justifyContent: 'flex-start',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-secondary rounded-full p-2 mr-3">
                <Ionicons name="add-circle" size={22} color="#000000" />
              </View>
              <View>
                <Text className="text-secondary text-xl font-bold">Create Sales Order</Text>
                <Text className="text-secondary/80 text-xs mt-0.5 tracking-wider">NEW ENQUIRY</Text>
              </View>
            </View>
          </View>

          <View className="px-6 pb-6 space-y-5">
            {/* Customer Type */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
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
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Customer Name *
              </Text>
              {customerType === 'Old' ? (
                <View className="bg-gray-900/60 border border-secondary/20 rounded-lg">
                  <Picker
                    selectedValue={selectedExistingClient}
                    onValueChange={(value) => {
                      setSelectedExistingClient(value);
                      setCustomerName(value);
                    }}
                    style={{ color: '#E5E7EB' }}
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
                  className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
                  placeholderTextColor="#9CA3AF"
                  onFocus={handleFocusScroll}
                />
              )}
            </View>

            {/* Delivery Address */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Delivery Address *
              </Text>
              <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Enter delivery address"
                multiline
                numberOfLines={3}
                className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                onFocus={handleFocusScroll}
              />
            </View>

            {/* Billing Address */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Billing Address *
              </Text>
              <TextInput
                value={billingAddress}
                onChangeText={setBillingAddress}
                placeholder="Enter billing address"
                multiline
                numberOfLines={3}
                className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                onFocus={handleFocusScroll}
              />
            </View>

            {/* PO Date */}
            {/* <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                PO Date *
              </Text>
              <Pressable
                onPress={() => openDatePicker('po')}
                className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3"
              >
                <Text className={poDate ? "text-gray-100" : "text-gray-400"}>
                  {poDate || 'YYYY-MM-DD'}
                </Text>
              </Pressable>
            </View> */}
            <DateField label="PO Date *" value={poDate} onChange={setPoDate} />

            {/* Payment Received */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
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
                  className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100 mt-2"
                  placeholderTextColor="#9CA3AF"
                  onFocus={handleFocusScroll}
                />
              )}
            </View>

            {/* Kit and Quantity Table */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Kit and Quantity
              </Text>
              <View className="bg-gray-900/60 rounded-lg border border-secondary/20 overflow-hidden">
                <View className="bg-gray-900/80 flex-row py-3">
                  <Text className="text-secondary font-bold text-center flex-1">S.N</Text>
                  <Text className="text-secondary font-bold text-center flex-2">Kit Name</Text>
                  <Text className="text-secondary font-bold text-center flex-1">Quantity</Text>
                </View>
                {kitNames.map((kitName, index) => (
                  <View key={index} className="flex-row items-center py-3 border-b border-gray-700">
                    <Text className="text-gray-100 font-bold text-center flex-1">{index + 1}</Text>
                    <Text className="text-gray-200 text-center flex-2 px-2">{kitName}</Text>
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
                        className="bg-gray-900/60 border border-secondary/20 rounded-lg text-center text-gray-100"
                        placeholderTextColor="#9CA3AF"
                        textAlignVertical="center"
                        onFocus={handleFocusScroll}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Total Kits */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Total No Of Kits
              </Text>
              <View className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3">
                <Text className="text-gray-100 font-bold">{totalKits}</Text>
              </View>
            </View>

            {/* Delivery Date */}
            {/* <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Delivery Date *
              </Text>
              <Pressable
                onPress={() => openDatePicker('delivery')}
                className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3"
              >
                <Text className={deliveryDate ? "text-gray-100" : "text-gray-400"}>
                  {deliveryDate || 'YYYY-MM-DD'}
                </Text>
              </Pressable>
            </View> */}
            <DateField label="Delivery Date *" value={deliveryDate} onChange={setDeliveryDate} />

            {/* Partial Delivery Allowed */}
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
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
            <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
              <Text className="text-secondary text-base font-semibold mb-3">
                Remarks
              </Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Any additional remarks..."
                multiline
                numberOfLines={3}
                className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                onFocus={handleFocusScroll}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row justify-center space-x-4 mt-2">
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                className={`px-8 py-4 rounded-xl flex-row items-center shadow-lg ${loading ? 'bg-gray-500' : 'bg-secondary'
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
                className={`px-8 py-4 rounded-xl flex-row items-center shadow-lg ${loading ? 'bg-gray-600' : 'bg-gray-700'
                  }`}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Clear</Text>
              </Pressable>
            </View>
          </View>
          {/* Date Picker Modal */}
          <Modal visible={datePicker.visible} transparent animationType="slide" onRequestClose={cancelDatePicker}>
            <View className="flex-1 bg-black/60 justify-end">
              <View className="bg-primary-950 border-t border-secondary/20 p-4 rounded-t-2xl">
                <Text className="text-secondary text-base font-semibold mb-3">Select Date</Text>
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-1 mr-2 bg-gray-900/60 rounded-lg border border-secondary/20">
                    <Picker
                      selectedValue={datePicker.month}
                      onValueChange={(v) => setDatePicker((s) => ({ ...s, month: v, day: Math.min(s.day, daysInMonth(s.year, v)) }))}
                      style={{ color: '#E5E7EB' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <Picker.Item key={m} label={`M ${m}`} value={m} />
                      ))}
                    </Picker>
                  </View>
                  <View className="flex-1 mx-1 bg-gray-900/60 rounded-lg border border-secondary/20">
                    <Picker
                      selectedValue={datePicker.day}
                      onValueChange={(v) => setDatePicker((s) => ({ ...s, day: v }))}
                      style={{ color: '#E5E7EB' }}
                    >
                      {Array.from({ length: daysInMonth(datePicker.year, datePicker.month) }, (_, i) => i + 1).map((d) => (
                        <Picker.Item key={d} label={`D ${d}`} value={d} />
                      ))}
                    </Picker>
                  </View>
                  <View className="flex-1 ml-2 bg-gray-900/60 rounded-lg border border-secondary/20">
                    <Picker
                      selectedValue={datePicker.year}
                      onValueChange={(v) => setDatePicker((s) => ({ ...s, year: v, day: Math.min(s.day, daysInMonth(v, s.month)) }))}
                      style={{ color: '#E5E7EB' }}
                    >
                      {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                        <Picker.Item key={y} label={`${y}`} value={y} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View className="flex-row justify-center gap-x-4 mt-2">
                  <Pressable onPress={cancelDatePicker} className="px-4 py-2 rounded-lg bg-gray-700">
                    <Text className="text-white">Clear</Text>
                  </Pressable>
                  <Pressable onPress={confirmDatePicker} className="px-4 py-2 rounded-lg bg-secondary">
                    <Text className="text-black font-semibold">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
          {/* </ScrollView> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}






// import "../../global.css";
// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   ScrollView,
//   Pressable,
//   Alert,
//   Platform,
//   ActivityIndicator,
//   KeyboardAvoidingView,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { Picker } from "@react-native-picker/picker";
// import { enquiryAPI } from "@/services/api";
// import { useRouter } from "expo-router";
// import DateField from "@/components/DateField";

// const kitNames = [
//   "2P×3, 10°, 6.2 FT",
//   "2P×3, 10°, 8.2 FT",
//   "2P×5, 10°, 6.2 FT",
//   "2P×5, 10°, 8.2 FT",
//   "2P×3, 15°, 6.2 FT",
//   "2P×3, 15°, 8.2 FT",
//   "2P×5, 15°, 6.2 FT",
//   "2P×5, 15°, 8.2 FT",
// ];

// export default function CreateEnquiry() {
//   const router = useRouter();
//   const scrollRef = useRef<ScrollView>(null);

//   const handleFocusScroll = () =>
//     setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

//   // form state
//   const [customerType, setCustomerType] = useState<"New" | "Old">("New");
//   const [customerName, setCustomerName] = useState("");
//   const [selectedExistingClient, setSelectedExistingClient] = useState("");
//   const [deliveryAddress, setDeliveryAddress] = useState("");
//   const [billingAddress, setBillingAddress] = useState("");
//   const [poDate, setPoDate] = useState("");
//   const [paymentReceived, setPaymentReceived] = useState<"" | "Yes" | "No" | "Partial">("");
//   const [paymentPercent, setPaymentPercent] = useState("");
//   const [quantities, setQuantities] = useState<string[]>(Array(8).fill(""));
//   const [qtySelection, setQtySelection] = useState<{ start: number; end: number }[]>(
//     Array(8).fill({ start: 0, end: 0 })
//   ); // caret control per quantity input
//   const [deliveryDate, setDeliveryDate] = useState("");
//   const [partialDelivery, setPartialDelivery] = useState<"" | "Yes" | "No">("");
//   const [remarks, setRemarks] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [existingClients, setExistingClients] = useState<string[]>([]);

//   // helpers for caret control (fixes cursor jump-to-end bug)
//   const setQtySelAt = (idx: number, sel: { start: number; end: number }, text: string) => {
//     const clamp = (n: number) => Math.max(0, Math.min(n, text.length));
//     setQtySelection((prev) => {
//       const next = [...prev];
//       next[idx] = { start: clamp(sel.start), end: clamp(sel.end) };
//       return next;
//     });
//   };

//   const sanitizeDigits = (s: string) => s.replace(/[^\d]/g, ""); // numeric only

//   const totalKits = quantities.reduce((sum, val) => sum + (parseInt(val || "0", 10) || 0), 0);

//   useEffect(() => {
//     (async () => {
//       try {
//         const enquiries = await enquiryAPI.getAll();
//         const uniqueClients = enquiries
//           .map((e: any) => e.client_name)
//           .filter((name: string) => name && name.trim() !== "")
//           .filter((name: string, idx: number, self: string[]) => self.indexOf(name) === idx)
//           .sort();
//         setExistingClients(uniqueClients);
//       } catch (err) {
//         console.error("Error fetching existing clients:", err);
//       }
//     })();
//   }, []);

//   const RadioButton = ({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) => (
//     <Pressable onPress={onPress} className="flex-row items-center mr-6 mb-2">
//       <View
//         className={`w-5 h-5 rounded-full border-2 mr-2 items-center justify-center ${
//           selected ? "border-secondary" : "border-gray-500"
//         }`}
//       >
//         {selected && <View className="w-2.5 h-2.5 rounded-full bg-secondary" />}
//       </View>
//       <Text className="text-gray-200 font-medium">{label}</Text>
//     </Pressable>
//   );

//   const handleSubmit = async () => {
//     // Validation
//     if (!customerName || !deliveryAddress || !billingAddress || !poDate || !paymentReceived || !deliveryDate || !partialDelivery) {
//       Alert.alert("Error", "Please fill in all required fields.");
//       return;
//     }

//     if (paymentReceived === "Partial") {
//       const pct = Number(paymentPercent);
//       if (!paymentPercent || isNaN(pct) || pct < 1 || pct > 100) {
//         Alert.alert("Error", "Please enter a valid payment percentage (1–100).");
//         return;
//       }
//     }

//     if (quantities.every((q) => !q || parseInt(q) <= 0)) {
//       Alert.alert("Error", "Please enter at least one kit quantity.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const enquiryData = {
//         client_name: customerName,
//         delivery_address: deliveryAddress,
//         billing_address: billingAddress,
//         po_date_str: poDate,
//         payment_received: paymentReceived,
//         payment_percentage: paymentPercent,
//         kit1_name: kitNames[0],
//         kit1_qty: quantities[0] || "0",
//         kit2_name: kitNames[1],
//         kit2_qty: quantities[1] || "0",
//         kit3_name: kitNames[2],
//         kit3_qty: quantities[2] || "0",
//         kit4_name: kitNames[3],
//         kit4_qty: quantities[3] || "0",
//         kit5_name: kitNames[4],
//         kit5_qty: quantities[4] || "0",
//         kit6_name: kitNames[5],
//         kit6_qty: quantities[5] || "0",
//         kit7_name: kitNames[6],
//         kit7_qty: quantities[6] || "0",
//         kit8_name: kitNames[7],
//         kit8_qty: quantities[7] || "0",
//         total_kits: totalKits.toString(),
//         delivery_date_str: deliveryDate,
//         partial_delivery_allowed: partialDelivery,
//         remarks: remarks,
//       };

//       await enquiryAPI.create(enquiryData);

//       Alert.alert("Success", "Sales Order Created Successfully!", [
//         {
//           text: "OK",
//           onPress: () => router.push("/"),
//         },
//       ]);
//     } catch (error: any) {
//       console.error("Error creating enquiry:", error);
//       Alert.alert("Error", error?.response?.data?.message || "Failed to create sales order. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setCustomerName("");
//     setSelectedExistingClient("");
//     setDeliveryAddress("");
//     setBillingAddress("");
//     setPoDate("");
//     setPaymentReceived("");
//     setPaymentPercent("");
//     setQuantities(Array(8).fill(""));
//     setQtySelection(Array(8).fill({ start: 0, end: 0 }));
//     setDeliveryDate("");
//     setPartialDelivery("");
//     setRemarks("");
//   };

//   return (
//     <View className="flex-1 bg-primary-950">
//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>
//         <ScrollView
//           ref={scrollRef}
//           contentContainerStyle={{ paddingTop: 16, paddingBottom: 28 }}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View className="px-6 pt-2 pb-4">
//             <View className="flex-row items-center">
//               <View className="bg-secondary rounded-full p-2 mr-3 shadow-md">
//                 <Ionicons name="add-circle" size={22} color="#000000" />
//               </View>
//               <View>
//                 <Text className="text-secondary text-xl font-extrabold">Create Sales Order</Text>
//                 <Text className="text-secondary/80 text-[11px] mt-0.5 tracking-wider">NEW ENQUIRY</Text>
//               </View>
//             </View>
//           </View>

//           <View className="px-6 space-y-5">
//             {/* Customer Type */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Customer Type</Text>
//               <View className="flex-row">
//                 <RadioButton selected={customerType === "New"} onPress={() => setCustomerType("New")} label="New" />
//                 <RadioButton selected={customerType === "Old"} onPress={() => setCustomerType("Old")} label="Old" />
//               </View>
//             </View>

//             {/* Customer Name */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Customer Name *</Text>
//               {customerType === "Old" ? (
//                 <View className="bg-gray-900/60 border border-secondary/20 rounded-lg">
//                   <Picker
//                     selectedValue={selectedExistingClient}
//                     onValueChange={(value) => {
//                       setSelectedExistingClient(value);
//                       setCustomerName(value);
//                     }}
//                     style={{ color: "#E5E7EB" }}
//                   >
//                     <Picker.Item label="Select existing client" value="" />
//                     {existingClients.map((client: string, index: number) => (
//                       <Picker.Item key={index} label={client} value={client} />
//                     ))}
//                   </Picker>
//                 </View>
//               ) : (
//                 <TextInput
//                   value={customerName}
//                   onChangeText={setCustomerName}
//                   placeholder="Enter customer name"
//                   className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
//                   placeholderTextColor="#9CA3AF"
//                   onFocus={handleFocusScroll}
//                 />
//               )}
//             </View>

//             {/* Delivery Address */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Delivery Address *</Text>
//               <TextInput
//                 value={deliveryAddress}
//                 onChangeText={setDeliveryAddress}
//                 placeholder="Enter delivery address"
//                 multiline
//                 numberOfLines={3}
//                 className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
//                 placeholderTextColor="#9CA3AF"
//                 textAlignVertical="top"
//                 onFocus={handleFocusScroll}
//               />
//             </View>

//             {/* Billing Address */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Billing Address *</Text>
//               <TextInput
//                 value={billingAddress}
//                 onChangeText={setBillingAddress}
//                 placeholder="Enter billing address"
//                 multiline
//                 numberOfLines={3}
//                 className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
//                 placeholderTextColor="#9CA3AF"
//                 textAlignVertical="top"
//                 onFocus={handleFocusScroll}
//               />
//             </View>

//             {/* PO Date */}
//             <DateField label="PO Date" required value={poDate} onChange={setPoDate} />

//             {/* Payment Received */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Payment Received *</Text>
//               <View className="flex-row flex-wrap">
//                 <RadioButton selected={paymentReceived === "Yes"} onPress={() => setPaymentReceived("Yes")} label="Yes" />
//                 <RadioButton selected={paymentReceived === "No"} onPress={() => setPaymentReceived("No")} label="No" />
//                 <RadioButton selected={paymentReceived === "Partial"} onPress={() => setPaymentReceived("Partial")} label="Partial" />
//               </View>

//               {paymentReceived === "Partial" && (
//                 <TextInput
//                   value={paymentPercent}
//                   onChangeText={(t) => setPaymentPercent(sanitizeDigits(t))}
//                   placeholder="Enter percentage (1–100)"
//                   keyboardType={Platform.select({ ios: "number-pad", android: "numeric", default: "numeric" })}
//                   className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100 mt-2"
//                   placeholderTextColor="#9CA3AF"
//                   onFocus={handleFocusScroll}
//                   maxLength={3}
//                 />
//               )}
//             </View>

//             {/* Kit and Quantity */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Kit and Quantity</Text>

//               <View className="bg-gray-900/60 rounded-lg border border-secondary/20 overflow-hidden">
//                 <View className="bg-gray-900/80 flex-row py-3">
//                   <Text className="text-secondary font-bold text-center flex-1">S.N</Text>
//                   <Text className="text-secondary font-bold text-center flex-[2]">Kit Name</Text>
//                   <Text className="text-secondary font-bold text-center flex-1">Quantity</Text>
//                 </View>

//                 {kitNames.map((kitName, index) => (
//                   <View key={index} className="flex-row items-center py-2.5 border-t border-gray-800">
//                     <Text className="text-gray-100 font-bold text-center flex-1">{index + 1}</Text>
//                     <Text className="text-gray-200 text-center flex-[2] px-2">{kitName}</Text>
//                     <View className="flex-1 px-2">
//                       <TextInput
//                         value={quantities[index]}
//                         onChangeText={(text) => {
//                           const sanitized = sanitizeDigits(text);
//                           const next = [...quantities];
//                           next[index] = sanitized;
//                           setQuantities(next);
//                           setQtySelAt(index, qtySelection[index], sanitized);
//                         }}
//                         onSelectionChange={(e) => {
//                           const sel = e.nativeEvent.selection;
//                           const text = quantities[index] ?? "";
//                           setQtySelAt(index, sel, text);
//                         }}
//                         selection={qtySelection[index]}
//                         placeholder="0"
//                         keyboardType={Platform.select({ ios: "number-pad", android: "numeric", default: "numeric" })}
//                         className="bg-gray-900/60 border border-secondary/20 rounded-lg px-3 py-2 text-center text-gray-100"
//                         placeholderTextColor="#9CA3AF"
//                         textAlignVertical="center"
//                         onFocus={handleFocusScroll}
//                         maxLength={5}
//                       />
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             </View>

//             {/* Total Kits */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Total No Of Kits</Text>
//               <View className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3">
//                 <Text className="text-gray-100 font-bold">{totalKits}</Text>
//               </View>
//             </View>

//             {/* Delivery Date */}
//             <DateField label="Delivery Date" required value={deliveryDate} onChange={setDeliveryDate} />

//             {/* Partial Delivery Allowed */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Partial Delivery Allowed *</Text>
//               <View className="flex-row">
//                 <RadioButton selected={partialDelivery === "Yes"} onPress={() => setPartialDelivery("Yes")} label="Yes" />
//                 <RadioButton selected={partialDelivery === "No"} onPress={() => setPartialDelivery("No")} label="No" />
//               </View>
//             </View>

//             {/* Remarks */}
//             <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
//               <Text className="text-secondary text-base font-semibold mb-3">Remarks</Text>
//               <TextInput
//                 value={remarks}
//                 onChangeText={setRemarks}
//                 placeholder="Any additional remarks..."
//                 multiline
//                 numberOfLines={3}
//                 className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 text-gray-100"
//                 placeholderTextColor="#9CA3AF"
//                 textAlignVertical="top"
//                 onFocus={handleFocusScroll}
//               />
//             </View>

//             {/* Buttons */}
//             <View className="flex-row justify-between mt-2 px-2">
//               <Pressable
//                 onPress={handleSubmit}
//                 disabled={loading}
//                 className={`flex-1 mr-2 px-6 py-4 rounded-xl flex-row items-center justify-center shadow-lg ${
//                   loading ? "bg-gray-500" : "bg-secondary"
//                 }`}
//               >
//                 {loading ? (
//                   <ActivityIndicator size="small" color="#000000" />
//                 ) : (
//                   <Ionicons name="checkmark" size={20} color="#000000" />
//                 )}
//                 <Text className="text-primary-950 font-extrabold ml-2">
//                   {loading ? "Creating..." : "Submit"}
//                 </Text>
//               </Pressable>

//               <Pressable
//                 onPress={handleCancel}
//                 disabled={loading}
//                 className={`flex-1 ml-2 px-6 py-4 rounded-xl flex-row items-center justify-center shadow-lg ${
//                   loading ? "bg-gray-600" : "bg-gray-700"
//                 }`}
//               >
//                 <Ionicons name="close" size={20} color="#FFFFFF" />
//                 <Text className="text-white font-extrabold ml-2">Cancel</Text>
//               </Pressable>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

