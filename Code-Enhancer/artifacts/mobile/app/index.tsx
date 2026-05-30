import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
// import "dotenv/config";   // ← sabse pehli line
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/login" />;
  if (isAdmin) return <Redirect href="/admin/dashboard" />;
  return <Redirect href="/(tabs)" />;
}
