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
import { dispatchAPI } from '@/services/api';

type Order = {
  id: string;
  project_id?: string;
  client_name?: string;
  sr?: string;
};

export default function OrderDispatchLots() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const order: Order = params.order ? JSON.parse(params.order as string) : {};
  
  const [dispatchLots, setDispatchLots] = useState<any[]>([]);
  const [newDispatchPct, setNewDispatchPct] = useState<string>('');

  useEffect(() => {
    loadDispatchLots();
  }, []);

  const loadDispatchLots = async () => {
    try {
      if (order.sr) {
        const lots = await dispatchAPI.getBySr(order.sr);
        setDispatchLots(lots || []);
      }
    } catch (e) {
      console.log('Dispatch lots fetch error:', e);
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    try {
      await dispatchAPI.patch(lotId, { deleted: 'Yes' });
      await loadDispatchLots();
      Alert.alert('Success', 'Lot deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete lot');
    }
  };

  const handleAddLot = async () => {
    const sr = order.sr;
    if (!sr) return;
    
    const pct = Number(newDispatchPct);
    if (!pct || pct < 1 || pct > 100) { 
      Alert.alert('Invalid', 'Enter 1-100'); 
      return; 
    }
    
    const nonDeleted = (dispatchLots || []).filter((l: any) => l.deleted !== 'Yes');
    const total = nonDeleted.reduce((s: number, l: any) => s + Number(l.percentage || 0), 0);
    if (total + pct > 100) { 
      Alert.alert('Invalid', `Total cannot exceed 100%. Current: ${total}%`); 
      return; 
    }
    
    const lot_number = (dispatchLots?.length || 0) + 1;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const lot_date_str = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    try {
      await dispatchAPI.create({ sr, lot_number, percentage: pct, deleted: 'No', lot_date_str });
      setNewDispatchPct('');
      await loadDispatchLots();
      Alert.alert('Success', 'Lot added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add lot');
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
          <Text className="text-secondary text-xl font-bold">Dispatch Lots</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <Text className="text-primary-950 text-lg font-bold">
              Dispatch Lots for {order.project_id}
            </Text>

            {/* Existing Lots */}
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
                        onPress={() => handleDeleteLot(lot.id)}
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

            {/* Add New Lot */}
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
                onPress={handleAddLot}
                className="mt-3 bg-green-500 px-4 py-2 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Save Lot</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}