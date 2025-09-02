import "../../global.css";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-primary-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-10 pb-6 border-b border-secondary/40">
          <View className="flex-row items-center">
            <View className="bg-secondary rounded-full p-3 mr-3">
              <Ionicons name="cube" size={24} color="#000000" />
            </View>
            <View className="flex-1">
              <Text className="text-secondary text-2xl font-extrabold">
                Sunrack RCC Kit
              </Text>
              <Text className="text-secondary/80 text-xs mt-0.5 tracking-wider">
                SALES MANAGEMENT SYSTEM
              </Text>
            </View>
          </View>

          <View className="mt-5 bg-gray-900/70 border border-secondary-DEFAULT/20 rounded-2xl p-4">
            <View className="flex-row items-center">
              <View className="bg-secondary/20 rounded-xl p-2 mr-3">
                <Ionicons name="speedometer" size={20} color="#FAD90E" />
              </View>
              <View className="flex-1">
                <Text className="text-secondary text-lg font-semibold">
                  Welcome to your dashboard
                </Text>
                <Text className="text-gray-300 text-xs mt-1">
                  Track enquiries, confirm orders, and stay on top of sales.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-6">
          <Text className="text-secondary text-xl font-bold mb-4">
            Quick Actions
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {/* Create Sales Order */}
            <TouchableOpacity
              onPress={() => router.push("/create-enquiry")}
              className="w-[48%] mb-4 bg-gray-900/70 rounded-2xl p-4 border border-secondary/25 active:opacity-90"
              style={{
                shadowColor: "#FAD90E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View className="h-10 w-10 rounded-xl bg-secondary items-center justify-center mb-3">
                <Ionicons name="add-circle" size={22} color="#000000" />
              </View>
              <Text className="text-secondary text-base font-semibold">
                Create Order
              </Text>
              <Text className="text-gray-300 text-xs mt-1 leading-4">
                Add new enquiry and capture customer requirements.
              </Text>
            </TouchableOpacity>

            {/* Orders Tracker */}
            <TouchableOpacity
              onPress={() => router.push("/confirmed-orders")}
              className="w-[48%] mb-4 bg-gray-900/70 rounded-2xl p-4 border border-secondary/25 active:opacity-90"
              style={{
                shadowColor: "#FAD90E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View className="h-10 w-10 rounded-xl bg-secondary items-center justify-center mb-3">
                <Ionicons name="list" size={22} color="#000000" />
              </View>
              <Text className="text-secondary text-base font-semibold">
                Orders Tracker
              </Text>
              <Text className="text-gray-300 text-xs mt-1 leading-4">
                View confirmed orders and monitor delivery status.
              </Text>
            </TouchableOpacity>

            {/* Analytics (Soon) - full width */}
            <View className="w-full bg-gray-900/40 rounded-2xl p-4 border border-gray-700 opacity-70">
              <View className="flex-row items-center">
                <View className="h-10 w-10 rounded-xl bg-gray-700 items-center justify-center mr-3">
                  <Ionicons name="analytics" size={22} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-base font-semibold">
                    Analytics
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Sales performance and insights coming soon.
                  </Text>
                </View>
                <View className="bg-gray-700 rounded-full px-3 py-1">
                  <Text className="text-gray-300 text-[10px] font-medium">SOON</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="mt-7">
            <Text className="text-secondary text-xl font-bold mb-3">
              Quick Stats
            </Text>
            <View className="flex-row justify-between">
              <View className="w-[32%] bg-gray-900/70 rounded-xl p-3 border border-secondary/20">
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={16} color="#FAD90E" />
                  <Text className="text-secondary text-xs font-medium ml-2">
                    Total
                  </Text>
                </View>
                <Text className="text-white text-xl font-bold mt-1">--</Text>
              </View>

              <View className="w-[32%] bg-gray-900/70 rounded-xl p-3 border border-secondary/20">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#FAD90E" />
                  <Text className="text-secondary text-xs font-medium ml-2">
                    Done
                  </Text>
                </View>
                <Text className="text-white text-xl font-bold mt-1">--</Text>
              </View>

              <View className="w-[32%] bg-gray-900/70 rounded-xl p-3 border border-secondary/20">
                <View className="flex-row items-center">
                  <Ionicons name="time" size={16} color="#FAD90E" />
                  <Text className="text-secondary text-xs font-medium ml-2">
                    Pending
                  </Text>
                </View>
                <Text className="text-white text-xl font-bold mt-1">--</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
