import React from 'react';
import { View, Text } from 'react-native';

export const StatusBadge = ({ status }: { status: string }) => {
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

export const PaymentBadge = ({ paymentReceived, percentage }: { paymentReceived: string, percentage: string }) => {
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