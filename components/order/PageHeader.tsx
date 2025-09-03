import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PageHeaderProps = {
  title: string;
  onBack: () => void;
};

export const PageHeader = ({ title, onBack }: PageHeaderProps) => {
  return (
    <View className="bg-primary-950 px-4 py-4 flex-row justify-between items-center">
      <Pressable onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#FAD90E" />
      </Pressable>
      <Text className="text-secondary text-xl font-bold">{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};