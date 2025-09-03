import "../../global.css";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { kitDispatchAPI } from '@/services/api';

type Order = {
  id: string;
  project_id?: string;
  client_name?: string;
  sr?: string;
};

export default function OrderKits() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse order data from params
  const order: Order = params.order ? JSON.parse(params.order as string) : {};

  const [kitsSummary, setKitsSummary] = useState<Array<{ name: string; qty: number; dispatched: number; pending: number }>>([]);
  const [kitsLots, setKitsLots] = useState<any[]>([]);
  const [lotInputs, setLotInputs] = useState<number[]>([]);
  const [isSavingLot, setIsSavingLot] = useState(false);


  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace("/(main)/confirmed-orders");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    loadKitsData();
  }, [params.orderData, order.sr]); // Reload when order data or SR changes

  const buildKitsFromOrder = (orderData: any) => {
    const kits: Array<{ name: string; qty: number }> = [];

    // Try different field name patterns
    for (let i = 1; i <= 8; i++) {
      // Original pattern: kit1_name, kit1_qty
      let name = orderData[`kit${i}_name`];
      let qtyRaw = orderData[`kit${i}_qty`];

      // Alternative patterns that might exist
      if (!name) {
        name = orderData[`kit_${i}_name`] ||
          orderData[`kit${i}Name`] ||
          orderData[`kit_${i}_Name`] ||
          orderData[`product${i}_name`] ||
          orderData[`item${i}_name`];
      }

      if (!qtyRaw) {
        qtyRaw = orderData[`kit${i}_quantity`] ||
          orderData[`kit_${i}_qty`] ||
          orderData[`kit${i}Qty`] ||
          orderData[`kit_${i}_quantity`] ||
          orderData[`product${i}_qty`] ||
          orderData[`item${i}_qty`] ||
          orderData[`kit${i}_quan`];
      }

      const qty = Number(qtyRaw) || 0;
      if (name && qty > 0) {
        kits.push({ name, qty });
        //console.log(`Found kit ${i}:`, { name, qty, originalNameField: `kit${i}_name`, originalQtyField: `kit${i}_qty` });
      }
    }

    // If no kits found with standard pattern, try to find in kits array or different structure
    if (kits.length === 0) {
      //console.log('No kits found with standard pattern, checking for alternative structures...');

      // Check if there's a kits array
      if (orderData.kits && Array.isArray(orderData.kits)) {
        orderData.kits.forEach((kit: any, index: number) => {
          const name = kit.name || kit.kit_name || kit.product_name || kit.item_name;
          const qty = Number(kit.quantity || kit.qty || kit.amount) || 0;
          if (name && qty > 0) {
            kits.push({ name, qty });
            //console.log(`Found kit from array[${index}]:`, { name, qty });
          }
        });
      }

      // Check for total_kits field and try to extract kit info differently
      if (kits.length === 0 && orderData.total_kits) {
        //console.log('Found total_kits but no individual kit details:', orderData.total_kits);
        // Create a generic kit entry
        kits.push({
          name: `Total Kits (${orderData.client_name || 'Order'})`,
          qty: Number(orderData.total_kits) || 0
        });
      }
    }

    return kits;
  };

  const formatNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const loadKitsData = async () => {
    try {
      // First, let's see what we actually received
      //console.log('Raw params:', params);
      //console.log('params.orderData type:', typeof params.orderData);
      //console.log('params.order type:', typeof params.order);

      const orderData = JSON.parse(params.orderData as string || '{}');

      // Debug: Log the order data to see what fields are available
      // //console.log('=== ORDER KITS DEBUG ===');
      // //console.log('Full order data:', orderData);
      // //console.log('Order data keys:', Object.keys(orderData));
      // console.log('Kit-related fields:', Object.keys(orderData).filter(key =>
      //   key.toLowerCase().includes('kit') ||
      //   key.toLowerCase().includes('name') ||
      //   key.toLowerCase().includes('qty') ||
      //   key.toLowerCase().includes('quantity')
      // ));

      // Also check for total_kits
      if (orderData.total_kits) {
        //console.log('Found total_kits:', orderData.total_kits);
      }

      const kits = buildKitsFromOrder(orderData);
      //console.log('Final built kits:', kits);
      //console.log('=== END DEBUG ===');

      let lots: any[] = [];
      let dispatchedByKit: number[] = kits.map(() => 0);

      if (order.sr) {
        lots = await kitDispatchAPI.getBySr(order.sr);
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
    } catch (e) {
      //console.log('Kits data fetch error:', e);
    }
  };

  const handleSaveLot = async () => {
    const sr = order.sr;
    if (!sr) return;

    const totalSum = (lotInputs || []).reduce((a, b) => a + (Number(b) || 0), 0);
    if (totalSum <= 0) {
      Alert.alert('Invalid', 'Enter at least one quantity');
      return;
    }

    setIsSavingLot(true); // Start loading

    const payload: any = { sr, sum: totalSum, delivery_date: formatNow() };
    for (let i = 0; i < kitsSummary.length; i++) {
      payload[`kit${i + 1}_dispatched`] = lotInputs[i] || 0;
    }

    try {
      await kitDispatchAPI.create(payload);
      await loadKitsData();
      Alert.alert('Success', 'Lot saved successfully!');
    } catch (error) {
      console.error('Error saving lot:', error);
      Alert.alert('Error', 'Failed to save lot. Please try again.');
    } finally {
      setIsSavingLot(false); // Stop loading
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* <View className="flex-1"> */}
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
          {/* Header */}
          {/* <View className="bg-primary-950 px-4 py-4 flex-row justify-between items-center">
            <Pressable onPress={() => router.navigate('/(main)/confirmed-orders')}>
              <Ionicons name="arrow-back" size={24} color="#FAD90E" />
            </Pressable>
            <Text className="text-secondary text-xl font-bold">Kit Specifications</Text>
            <View style={{ width: 24 }} />
          </View> */}

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              <Text className="text-primary-950 text-lg font-bold">
                Kits for {order.client_name} ({order.project_id})
              </Text>

              {/* Debug Info */}
              {/* <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <Text className="text-yellow-800 font-bold text-sm mb-2">Debug Info:</Text>
                <Text className="text-yellow-700 text-xs">Order ID: {order.id}</Text>
                <Text className="text-yellow-700 text-xs">SR: {order.sr}</Text>
                <Text className="text-yellow-700 text-xs">Kits found: {kitsSummary.length}</Text>
              </View> */}

              {/* Kits Summary */}
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
                  <Text className="text-gray-400 text-sm mt-2">Check console for debug info</Text>
                </View>
              )}

              {/* Previous Lots */}
              {kitsLots?.length > 0 && (
                <View className="bg-white rounded-xl p-4 shadow-md">
                  <Text className="text-primary-950 font-bold text-base mb-2">Previous Lots</Text>
                  {kitsLots.map((lot, idx) => {
                    const sum = lot.sum || 0;
                    const totalKits = kitsSummary.reduce((total, kit) => total + kit.qty, 0);
                    const percentage = totalKits > 0 ? ((sum / totalKits) * 100).toFixed(2) : '0.00';
                    
                    return (
                      <View key={idx} className="flex-row justify-between py-1 border-b border-gray-200">
                        <Text className="text-gray-700">Lot {idx + 1}</Text>
                        <Text className="text-gray-700">Sum: {sum} ({percentage}%)</Text>
                        <Text className="text-gray-700">Date: {lot.delivery_date || lot.delivery_date_str || '-'}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add New Lot */}
              {kitsSummary.length > 0 && (
                <View className="bg-white rounded-xl p-4 shadow-md">
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
                    onPress={handleSaveLot}
                    disabled={isSavingLot}
                    className={`mt-3 px-4 py-2 rounded-lg items-center flex-row justify-center ${
                      isSavingLot ? 'bg-blue-300' : 'bg-blue-500'
                    }`}
                  >
                    {isSavingLot && (
                      <ActivityIndicator 
                        size="small" 
                        color="white" 
                        style={{ marginRight: 8 }} 
                      />
                    )}
                    <Text className="text-white font-semibold">
                      {isSavingLot ? 'Saving...' : 'Save Lot'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}