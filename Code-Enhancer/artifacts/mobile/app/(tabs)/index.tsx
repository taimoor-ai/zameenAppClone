import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

type TabFilter = "all" | "sale" | "rent";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { properties } = useProperties();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const filtered = useMemo(() => {
    let list = properties;
    if (activeTab === "sale") list = list.filter((p) => p.listingType === "sale");
    else if (activeTab === "rent") list = list.filter((p) => p.listingType === "rent");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.city.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [properties, activeTab, search]);

  const featured = useMemo(() => properties.filter((p) => p.featured).slice(0, 5), [properties]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const TabBtn = ({ label, value }: { label: string; value: TabFilter }) => (
    <TouchableOpacity
      style={[
        styles.tabBtn,
        { backgroundColor: activeTab === value ? colors.primary : colors.card, borderColor: activeTab === value ? colors.primary : colors.border },
      ]}
      onPress={() => { setActiveTab(value); Haptics.selectionAsync(); }}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabBtnText, { color: activeTab === value ? "#fff" : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      <LinearGradient colors={["#064E3B", "#059669"]} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] ?? "User"} 👋</Text>
            <Text style={styles.greetingSub}>Find your dream property</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "U"}</Text>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: "#fff" }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by city, area, or type..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <View style={styles.tabRow}>
          <TabBtn label="All" value="all" />
          <TabBtn label="Buy" value="sale" />
          <TabBtn label="Rent" value="rent" />
        </View>

        {!search && featured.length > 0 && activeTab === "all" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {search ? `Results for "${search}"` : activeTab === "sale" ? "Properties For Sale" : activeTab === "rent" ? "Properties For Rent" : "All Listings"}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PropertyCard property={item} />
          </View>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings found</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search ? `No properties matching "${search}"` : "No properties available yet"}
            </Text>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 80 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  greetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  greetingSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  body: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingTop: 20 },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5 },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  list: {},
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
