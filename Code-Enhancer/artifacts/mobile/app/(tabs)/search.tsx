import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import FilterModal, { Filters } from "@/components/FilterModal";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

const DEFAULT_FILTERS: Filters = { listingType: "all", city: "", propertyType: "", minPrice: 0, maxPrice: 0 };

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const hasActiveFilters =
    filters.listingType !== "all" || filters.city !== "" || filters.propertyType !== "" || filters.minPrice > 0 || filters.maxPrice > 0;

  const activeCount = [
    filters.listingType !== "all",
    filters.city !== "",
    filters.propertyType !== "",
    filters.minPrice > 0 || filters.maxPrice > 0,
  ].filter(Boolean).length;

  const results = useMemo(() => {
    let list = properties;
    if (filters.listingType !== "all") list = list.filter((p) => p.listingType === filters.listingType);
    if (filters.city) list = list.filter((p) => p.city.toLowerCase() === filters.city.toLowerCase());
    if (filters.propertyType) list = list.filter((p) => p.type === filters.propertyType);
    if (filters.minPrice > 0) list = list.filter((p) => p.price >= filters.minPrice);
    if (filters.maxPrice > 0) list = list.filter((p) => p.price <= filters.maxPrice);
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
  }, [properties, filters, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Search Properties</Text>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="City, area, or property type..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: hasActiveFilters ? colors.primary : colors.card, borderColor: hasActiveFilters ? colors.primary : colors.border },
            ]}
            onPress={() => { setShowFilter(true); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={18} color={hasActiveFilters ? "#fff" : colors.text} />
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: hasActiveFilters ? "#fff" : colors.primary }]}>
                <Text style={[styles.badgeText, { color: hasActiveFilters ? colors.primary : "#fff" }]}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          {(["all", "sale", "rent"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tabBtn,
                { backgroundColor: filters.listingType === t ? colors.primary : "transparent", borderColor: filters.listingType === t ? colors.primary : colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilters((f) => ({ ...f, listingType: t }));
              }}
            >
              <Text style={[styles.tabText, { color: filters.listingType === t ? "#fff" : colors.mutedForeground }]}>
                {t === "all" ? "All" : t === "sale" ? "Buy" : "Rent"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearRow} onPress={() => { setFilters(DEFAULT_FILTERS); Haptics.selectionAsync(); }}>
            <Feather name="x-circle" size={14} color={colors.primary} />
            <Text style={[styles.clearText, { color: colors.primary }]}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PropertyCard property={item} compact />
          </View>
        )}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {results.length} {results.length === 1 ? "property" : "properties"} found
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings found matching your search</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Try adjusting your filters or search terms</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.primary }]}
                onPress={() => setFilters(DEFAULT_FILTERS)}
              >
                <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === "web" ? 34 + 84 : 80 }}
        showsVerticalScrollIndicator={false}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onApply={(f) => { setFilters(f); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  clearRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  resultCount: { fontSize: 13, fontFamily: "Inter_500Medium", paddingHorizontal: 16, paddingVertical: 12 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  clearBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  clearBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
