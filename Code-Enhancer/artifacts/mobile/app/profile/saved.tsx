import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PropertyCard from "@/components/PropertyCard";
import { useFavourites } from "@/context/FavouritesContext";
import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedProperties, clearFavourites } = useFavourites();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const saved = savedProperties;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Saved Properties</Text>
        {saved.length > 0 ? (
          <TouchableOpacity onPress={clearFavourites}>
            <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {saved.length > 0 && (
        <View style={[styles.countBar, { backgroundColor: colors.primaryLight }]}>
          <Feather name="heart" size={14} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.primary }]}>
            {saved.length} saved {saved.length === 1 ? "property" : "properties"}
          </Text>
        </View>
      )}

      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PropertyCard property={item} />
          </View>
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: Platform.OS === "web" ? 34 : 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather name="heart" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved properties</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap the heart icon on any listing to save it here for later
            </Text>
            <TouchableOpacity
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.browseBtnText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  clearText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  countBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  countText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  browseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 4,
  },
  browseBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
