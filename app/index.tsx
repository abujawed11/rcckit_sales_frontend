


import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-950">
        <ActivityIndicator size="large" color="#FAD90E" />
      </View>
    );
  }

  if (user?.success) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}