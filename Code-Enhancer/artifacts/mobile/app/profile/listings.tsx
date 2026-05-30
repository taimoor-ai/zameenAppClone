import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

export default function MyListingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { properties } = useProperties();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myListings = properties.filter((p) => p.ownerId === user?.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Listings</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={myListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PropertyCard property={item} compact />
          </View>
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: Platform.OS === "web" ? 34 : 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="home" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Post a property to see it here</Text>
            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/post")}
            >
              <Text style={styles.postBtnText}>Post a Property</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  postBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  postBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
