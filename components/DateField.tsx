import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";

type DateFieldProps = {
  label: string;
  value: string; // expects "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function DateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = (date: Date) => {
    const formatted = dayjs(date).format("YYYY-MM-DD");
    onChange(formatted);
    setOpen(false);
  };

  return (
    <View className="bg-gray-900/70 rounded-2xl p-4 border border-secondary/20">
      <Text className="text-secondary text-base font-semibold mb-3">{label}</Text>

      <View className="relative">
        <Pressable
          onPress={() => setOpen(true)}
          className="bg-gray-900/60 border border-secondary/20 rounded-lg px-4 py-3 pr-12"
        >
          <Text className={value ? "text-gray-100" : "text-gray-400"}>
            {value || placeholder}
          </Text>
        </Pressable>

        {/* calendar icon on right */}
        <Pressable
          onPress={() => setOpen(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-secondary/20"
          hitSlop={10}
        >
          <Ionicons name="calendar-outline" size={18} color="#FAD90E" />
        </Pressable>
      </View>

      <DateTimePickerModal
        isVisible={open}
        mode="date"
        display={Platform.select({
          ios: "inline",
          android: "calendar",
          default: "default",
        })}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}
