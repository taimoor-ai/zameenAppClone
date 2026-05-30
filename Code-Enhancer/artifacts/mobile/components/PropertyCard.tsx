import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useFavourites } from "@/context/FavouritesContext";
import { Property } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  property: Property;
  compact?: boolean;
}

function formatPrice(price: number, listingType: string) {
  if (listingType === "rent") {
    if (price >= 100000) return `${(price / 100000).toFixed(1)}L/mo`;
    return `${price.toLocaleString()}/mo`;
  }
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `${(price / 100000).toFixed(1)} L`;
  return price.toLocaleString();
}

const TYPE_ICONS: Record<string, string> = {
  house: "home",
  apartment: "layers",
  plot: "map",
  commercial: "briefcase",
  farmhouse: "feather",
};

export default function PropertyCard({ property, compact = false }: Props) {
  const colors = useColors();
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(property.id);

  const onPress = () => {
    Haptics.selectionAsync();
    router.push(`/property/${property.id}`);
  };

  const onHeart = async (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(fav ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavourite(property.id, property);
  };

  const hasImage = property.images && property.images.length > 0;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.compactImageContainer, { backgroundColor: colors.primaryLight }]}>
          {hasImage ? (
            <Image source={{ uri: property.images[0] }} style={styles.compactImage} resizeMode="cover" />
          ) : (
            <Feather name={TYPE_ICONS[property.type] as any || "home"} size={28} color={colors.primary} />
          )}
        </View>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1}>{property.title}</Text>
          <Text style={[styles.compactLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
            {property.area}, {property.city}
          </Text>
          <View style={styles.compactBottom}>
            <Text style={[styles.compactPrice, { color: colors.primary }]}>
              PKR {formatPrice(property.price, property.listingType)}
            </Text>
            <View style={styles.compactRight}>
              <View style={[styles.badge, { backgroundColor: property.listingType === "sale" ? colors.primaryLight : "#FEF3C7" }]}>
                <Text style={[styles.badgeText, { color: property.listingType === "sale" ? colors.primary : colors.accent }]}>
                  {property.listingType === "sale" ? "For Sale" : "For Rent"}
                </Text>
              </View>
              <TouchableOpacity onPress={onHeart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={fav ? "heart" : "heart"} size={16} color={fav ? "#EF4444" : colors.mutedForeground}
                  style={fav ? styles.heartFilled : undefined} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.primaryLight }]}>
        {hasImage ? (
          <Image source={{ uri: property.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Feather name={TYPE_ICONS[property.type] as any || "home"} size={44} color={colors.primary} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>{property.type}</Text>
          </View>
        )}
        <View style={[styles.listingBadge, { backgroundColor: property.listingType === "sale" ? colors.primary : colors.accent }]}>
          <Text style={styles.listingBadgeText}>{property.listingType === "sale" ? "For Sale" : "For Rent"}</Text>
        </View>
        {property.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="star" size={10} color={colors.accent} />
            <Text style={[styles.featuredText, { color: colors.accent }]}>Featured</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.heartBtn, { backgroundColor: fav ? "#FEF2F2" : "rgba(255,255,255,0.9)" }]}
          onPress={onHeart}
          activeOpacity={0.8}
        >
          <Feather
            name="heart"
            size={18}
            color={fav ? "#EF4444" : "#64748B"}
            style={fav ? styles.heartFilled : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={[styles.price, { color: colors.primary }]}>
          PKR {formatPrice(property.price, property.listingType)}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{property.title}</Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground }]} numberOfLines={1}>
            {property.area}, {property.city}
          </Text>
        </View>
        {(property.bedrooms > 0 || property.bathrooms > 0 || property.size) && (
          <View style={[styles.specsRow, { borderTopColor: colors.border }]}>
            {property.bedrooms > 0 && (
              <View style={styles.spec}>
                <Feather name="moon" size={12} color={colors.mutedForeground} />
                <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.bedrooms} Bed</Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View style={styles.spec}>
                <Feather name="droplet" size={12} color={colors.mutedForeground} />
                <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.bathrooms} Bath</Text>
              </View>
            )}
            {property.size ? (
              <View style={styles.spec}>
                <Feather name="maximize-2" size={12} color={colors.mutedForeground} />
                <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.size}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: { height: 200, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { fontSize: 13, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  listingBadge: {
    position: "absolute", top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  listingBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  featuredBadge: {
    position: "absolute", top: 12, right: 52,
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  featuredText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  heartBtn: {
    position: "absolute", top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  heartFilled: {},
  info: { padding: 14 },
  price: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 13, fontFamily: "Inter_400Regular" },
  specsRow: { flexDirection: "row", gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  spec: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  compactCard: {
    flexDirection: "row", borderRadius: 12, borderWidth: 1,
    marginBottom: 12, overflow: "hidden",
  },
  compactImageContainer: {
    width: 90, height: 90,
    alignItems: "center", justifyContent: "center",
  },
  compactImage: { width: 90, height: 90 },
  compactInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
  compactTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  compactLocation: { fontSize: 12, fontFamily: "Inter_400Regular" },
  compactBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  compactPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  compactRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  accent: {},
});
