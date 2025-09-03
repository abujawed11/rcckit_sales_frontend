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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

  useEffect(() => {
    loadKitsData();
  }, []);

  const buildKitsFromOrder = (orderData: any) => {
    const kits: Array<{ name: string; qty: number }> = [];
    for (let i = 1; i <= 8; i++) {
      const name = orderData[`kit${i}_name`];
      const qtyRaw = orderData[`kit${i}_qty`];
      const qty = Number(qtyRaw) || 0;
      if (name && qty > 0) kits.push({ name, qty });
    }
    return kits;
  };

  const formatNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const loadKitsData = async () => {
    try {
      const orderData = JSON.parse(params.orderData as string || '{}');
      const kits = buildKitsFromOrder(orderData);
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
      console.log('Kits data fetch error:', e);
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
    
    const payload: any = { sr, sum: totalSum, delivery_date: formatNow() };
    for (let i = 0; i < kitsSummary.length; i++) {
      payload[`kit${i+1}_dispatched`] = lotInputs[i] || 0;
    }
    
    try {
      await kitDispatchAPI.create(payload);
      await loadKitsData();
      Alert.alert('Success', 'Lot saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save lot');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-primary-950 px-4 py-4 flex-row justify-between items-center">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FAD90E" />
          </Pressable>
          <Text className="text-secondary text-xl font-bold">Kit Specifications</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <Text className="text-primary-950 text-lg font-bold">
              Kits for {order.client_name} ({order.project_id})
            </Text>

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
              </View>
            )}

            {/* Previous Lots */}
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
                  className="mt-3 bg-blue-500 px-4 py-2 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Save Lot</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}