import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Svg, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

type ListingFilter = "all" | "sale" | "rent";

const { width: W, height: H } = Dimensions.get("window");
const MAP_H = Platform.OS === "web" ? 340 : H * 0.52;

// Pakistan bounding box: lat 23.5–37.5, lon 60.5–77.5
const LAT_MIN = 23.5, LAT_MAX = 37.5, LON_MIN = 60.5, LON_MAX = 77.5;

const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Karachi",    lat: 24.86, lon: 67.00 },
  { name: "Lahore",     lat: 31.52, lon: 74.36 },
  { name: "Multan",     lat: 30.16, lon: 71.52 },
  { name: "Islamabad",  lat: 33.68, lon: 73.05 },
  { name: "Rawalpindi", lat: 33.57, lon: 73.02 },
  { name: "Chakwal",    lat: 32.93, lon: 72.86 },
];

const PAD = 32;
const VW = W - 0;
const VH = MAP_H;

function toXY(lat: number, lon: number) {
  const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (VW - PAD * 2);
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (VH - PAD * 2);
  return { x, y };
}

// Simplified Pakistan outline path (normalised to 0-1 space, then scaled)
const OUTLINE_POINTS: [number, number][] = [
  [0.5,0.02],[0.62,0.05],[0.72,0.06],[0.82,0.0],[0.88,0.04],[0.95,0.1],
  [0.99,0.18],[0.97,0.24],[0.88,0.28],[0.82,0.34],[0.82,0.42],[0.86,0.50],
  [0.85,0.56],[0.78,0.60],[0.72,0.58],[0.68,0.62],[0.72,0.70],[0.70,0.78],
  [0.60,0.84],[0.50,0.88],[0.40,0.92],[0.30,0.95],[0.22,0.90],[0.18,0.82],
  [0.15,0.74],[0.10,0.68],[0.06,0.60],[0.04,0.52],[0.08,0.44],[0.12,0.36],
  [0.10,0.28],[0.14,0.20],[0.20,0.14],[0.28,0.10],[0.36,0.06],[0.44,0.03],
  [0.5,0.02],
];

function buildOutlinePath() {
  const pw = VW - PAD;
  const ph = VH - PAD;
  const pts = OUTLINE_POINTS.map(([px, py]) => [PAD / 2 + px * pw, PAD / 2 + py * ph]);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    if (filter === "all") return properties;
    return properties.filter((p) => p.listingType === filter);
  }, [properties, filter]);

  const cityData = useMemo(() =>
    CITIES.map((c) => {
      const matches = filtered.filter((p) => p.city.toLowerCase() === c.name.toLowerCase());
      return { ...c, count: matches.length, properties: matches };
    }), [filtered]);

  const selectedData = cityData.find((c) => c.name === selectedCity);

  const openCity = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCity(name);
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setSelectedCity(null));
  };

  const sheetTranslate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  const outlinePath = buildOutlinePath();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Property Map</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Pakistan — tap a city to explore</Text>
        <View style={styles.filterRow}>
          {(["all", "sale", "rent"] as ListingFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, { borderColor: filter === f ? colors.primary : colors.border, backgroundColor: filter === f ? colors.primary : colors.card }]}
              onPress={() => { setFilter(f); Haptics.selectionAsync(); closeSheet(); }}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
                {f === "all" ? "All" : f === "sale" ? "Buy" : "Rent"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SVG Map */}
      <View style={[styles.mapContainer, { height: MAP_H, backgroundColor: "#E8F4F0" }]}>
        <Svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
          <Defs>
            <LinearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D1FAE5" stopOpacity="1" />
              <Stop offset="1" stopColor="#A7F3D0" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="land" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ECFDF5" stopOpacity="1" />
              <Stop offset="1" stopColor="#D1FAE5" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background ocean */}
          <Rect width={VW} height={VH} fill="url(#mapBg)" />

          {/* Pakistan land outline */}
          <Path d={outlinePath} fill="url(#land)" stroke="#6EE7B7" strokeWidth="2" opacity={0.9} />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <G key={t}>
              <Path d={`M${VW * t},0 L${VW * t},${VH}`} stroke="#A7F3D0" strokeWidth="0.5" opacity={0.6} />
              <Path d={`M0,${VH * t} L${VW},${VH * t}`} stroke="#A7F3D0" strokeWidth="0.5" opacity={0.6} />
            </G>
          ))}

          {/* City markers */}
          {cityData.map((city) => {
            const { x, y } = toXY(city.lat, city.lon);
            const isSelected = selectedCity === city.name;
            const hasProps = city.count > 0;
            const r = hasProps ? Math.min(8 + city.count * 3, 26) : 8;

            return (
              <G key={city.name} onPress={() => openCity(city.name)}>
                {/* Pulse ring */}
                {hasProps && (
                  <Circle cx={x} cy={y} r={r + 8} fill={isSelected ? "#059669" : "#10B981"} opacity={0.15} />
                )}
                {/* Main circle */}
                <Circle
                  cx={x} cy={y} r={r}
                  fill={isSelected ? "#059669" : hasProps ? "#10B981" : "#94A3B8"}
                  stroke="#fff"
                  strokeWidth={isSelected ? 3 : 2}
                />
                {/* Count text */}
                {hasProps && (
                  <SvgText
                    x={x} y={y + 1}
                    textAnchor="middle"
                    fontSize={r > 14 ? 11 : 9}
                    fontWeight="700"
                    fill="#fff"
                  >
                    {city.count}
                  </SvgText>
                )}
                {/* City label */}
                <SvgText
                  x={x}
                  y={y + r + 13}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isSelected ? "700" : "600"}
                  fill={isSelected ? "#064E3B" : "#1E293B"}
                >
                  {city.name}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: "rgba(255,255,255,0.92)" }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.legendText}>Has listings</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#94A3B8" }]} />
            <Text style={styles.legendText}>No listings</Text>
          </View>
        </View>
      </View>

      {/* City list fallback when nothing selected */}
      {!selectedCity && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.citiesHeading, { color: colors.mutedForeground }]}>All cities</Text>
          <View style={styles.cityGrid}>
            {cityData.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[styles.cityChip, { backgroundColor: c.count > 0 ? colors.primaryLight : colors.muted, borderColor: c.count > 0 ? colors.primary : colors.border }]}
                onPress={() => openCity(c.name)}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={12} color={c.count > 0 ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.cityChipName, { color: c.count > 0 ? colors.primary : colors.mutedForeground }]}>{c.name}</Text>
                <View style={[styles.countBubble, { backgroundColor: c.count > 0 ? colors.primary : colors.mutedForeground }]}>
                  <Text style={styles.countBubbleText}>{c.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bottom Sheet */}
      {selectedCity && (
        <>
          <TouchableOpacity style={styles.sheetBackdrop} onPress={closeSheet} activeOpacity={1} />
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderTopColor: colors.border, transform: [{ translateY: sheetTranslate }] },
            ]}
          >
            <View style={styles.sheetHandle}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetCity, { color: colors.text }]}>{selectedCity}</Text>
                <Text style={[styles.sheetCount, { color: colors.mutedForeground }]}>
                  {selectedData?.count ?? 0} {(selectedData?.count ?? 0) === 1 ? "property" : "properties"} available
                </Text>
              </View>
              <TouchableOpacity onPress={closeSheet} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Feather name="x" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedData && selectedData.properties.length > 0 ? (
              <FlatList
                data={selectedData.properties}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={{ paddingHorizontal: 16 }}>
                    <PropertyCard property={item} compact />
                  </View>
                )}
                style={styles.sheetList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              />
            ) : (
              <View style={styles.sheetEmpty}>
                <Feather name="map-pin" size={36} color={colors.mutedForeground} />
                <Text style={[styles.sheetEmptyTitle, { color: colors.text }]}>No listings in {selectedCity}</Text>
                <Text style={[styles.sheetEmptySub, { color: colors.mutedForeground }]}>
                  {filter !== "all" ? `Try switching to "All" to see more results` : "Be the first to list a property here!"}
                </Text>
                <TouchableOpacity
                  style={[styles.postBtn, { backgroundColor: colors.primary }]}
                  onPress={() => { closeSheet(); router.push("/(tabs)/post"); }}
                >
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={styles.postBtnText}>Post a Property</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 10 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mapContainer: { position: "relative", overflow: "hidden" },
  legend: {
    position: "absolute", bottom: 10, left: 10,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#1E293B" },
  citiesHeading: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cityChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5,
  },
  cityChipName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  countBubble: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  countBubbleText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 9 },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, maxHeight: "60%", zIndex: 10,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  sheetCity: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sheetList: { flex: 1 },
  sheetEmpty: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 32, gap: 10 },
  sheetEmptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sheetEmptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 6 },
  postBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
