import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface Filters {
  listingType: "all" | "sale" | "rent";
  city: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
}

const CITIES = ["All Cities", "Karachi", "Lahore", "Multan", "Chakwal", "Islamabad", "Rawalpindi"];
const PROPERTY_TYPES = ["All Types", "house", "apartment", "plot", "commercial", "farmhouse"];
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: 0 },
  { label: "Under 50L", min: 0, max: 5000000 },
  { label: "50L – 1 Cr", min: 5000000, max: 10000000 },
  { label: "1 Cr – 2 Cr", min: 10000000, max: 20000000 },
  { label: "2 Cr – 5 Cr", min: 20000000, max: 50000000 },
  { label: "Above 5 Cr", min: 50000000, max: 0 },
];
const RENT_RANGES = [
  { label: "Any Price", min: 0, max: 0 },
  { label: "Under 30K", min: 0, max: 30000 },
  { label: "30K – 60K", min: 30000, max: 60000 },
  { label: "60K – 100K", min: 60000, max: 100000 },
  { label: "100K – 200K", min: 100000, max: 200000 },
  { label: "Above 200K", min: 200000, max: 0 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}

export default function FilterModal({ visible, onClose, filters, onApply }: Props) {
  const colors = useColors();
  const [local, setLocal] = useState<Filters>(filters);
  const priceRanges = local.listingType === "rent" ? RENT_RANGES : PRICE_RANGES;

  const selectedPriceLabel = priceRanges.find(
    (r) => r.min === local.minPrice && r.max === local.maxPrice
  )?.label ?? "Any Price";

  const reset = () => {
    Haptics.selectionAsync();
    setLocal({ listingType: "all", city: "", propertyType: "", minPrice: 0, maxPrice: 0 });
  };

  const apply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(local);
    onClose();
  };

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryLight : colors.card },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={reset}>
            <Text style={[styles.reset, { color: colors.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={[styles.section, { color: colors.text }]}>Listing Type</Text>
          <View style={styles.chips}>
            {(["all", "sale", "rent"] as const).map((t) => (
              <Chip
                key={t}
                label={t === "all" ? "All" : t === "sale" ? "Buy" : "Rent"}
                active={local.listingType === t}
                onPress={() => { Haptics.selectionAsync(); setLocal((p) => ({ ...p, listingType: t })); }}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.text }]}>City</Text>
          <View style={styles.chips}>
            {CITIES.map((c) => {
              const val = c === "All Cities" ? "" : c;
              return (
                <Chip key={c} label={c} active={local.city === val}
                  onPress={() => { Haptics.selectionAsync(); setLocal((p) => ({ ...p, city: val })); }}
                />
              );
            })}
          </View>

          <Text style={[styles.section, { color: colors.text }]}>Property Type</Text>
          <View style={styles.chips}>
            {PROPERTY_TYPES.map((t) => {
              const val = t === "All Types" ? "" : t;
              return (
                <Chip key={t}
                  label={t === "All Types" ? t : t.charAt(0).toUpperCase() + t.slice(1)}
                  active={local.propertyType === val}
                  onPress={() => { Haptics.selectionAsync(); setLocal((p) => ({ ...p, propertyType: val })); }}
                />
              );
            })}
          </View>

          <Text style={[styles.section, { color: colors.text }]}>Price Range</Text>
          <View style={styles.chips}>
            {priceRanges.map((r) => (
              <Chip key={r.label} label={r.label}
                active={selectedPriceLabel === r.label}
                onPress={() => { Haptics.selectionAsync(); setLocal((p) => ({ ...p, minPrice: r.min, maxPrice: r.max })); }}
              />
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={apply} activeOpacity={0.85}>
            <Text style={styles.applyText}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  reset: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  body: { flex: 1, paddingHorizontal: 20 },
  section: { fontSize: 15, fontFamily: "Inter_700Bold", marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: {
    padding: 20, paddingBottom: 34, borderTopWidth: 1,
  },
  applyBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  applyText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
