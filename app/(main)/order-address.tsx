import "../../global.css";
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Order } from '@/components/order/OrderTypes';
import { PageHeader } from '@/components/order/PageHeader';

export default function OrderAddress() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse order data from params
  const order: Order = params.order ? JSON.parse(params.order as string) : {};

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <PageHeader title="Address Details" onBack={() => router.back()} />

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            {/* Order Information */}
            <View className="bg-white rounded-xl p-4 shadow-md">
              <Text className="text-primary-950 text-lg font-bold mb-3">Order Information</Text>
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="text-gray-600 font-semibold w-24">Client:</Text>
                  <Text className="text-primary-950 flex-1">{order.client_name || 'N/A'}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600 font-semibold w-24">Project ID:</Text>
                  <Text className="text-primary-950 flex-1">{order.project_id || 'N/A'}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-600 font-semibold w-24">Order Value:</Text>
                  <Text className="text-primary-950 flex-1">{order.order_value || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Shipping Address */}
            <View className="bg-white rounded-xl p-4 shadow-md">
              <Text className="text-primary-950 text-lg font-bold mb-3">Shipping Address</Text>
              <Text className="text-primary-950 leading-6">
                {order.shipping_address || 'No shipping address provided'}
              </Text>
            </View>

            {/* Billing Address */}
            <View className="bg-white rounded-xl p-4 shadow-md">
              <Text className="text-primary-950 text-lg font-bold mb-3">Billing Address</Text>
              <Text className="text-primary-950 leading-6">
                {order.billing_address || 'No billing address provided'}
              </Text>
            </View>

            {/* Remarks */}
            {order.remarks && (
              <View className="bg-white rounded-xl p-4 shadow-md">
                <Text className="text-primary-950 text-lg font-bold mb-3">Remarks</Text>
                <Text className="text-primary-950 leading-6">{order.remarks}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}