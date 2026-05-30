import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";
import { getObjectUrl } from "@/lib/storage";

const { width } = Dimensions.get("window");

function formatPrice(price: number, listingType: string) {
  if (listingType === "rent") {
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(1)}L/mo`;
    return `PKR ${price.toLocaleString()}/mo`;
  }
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Crore`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(1)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
}

function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("92")) return "+" + digits;
  if (digits.startsWith("0")) return "+92" + digits.slice(1);
  if (digits.startsWith("3") && digits.length === 10) return "+92" + digits;
  if (digits.startsWith("3") && digits.length === 11) return "+" + digits;
  return "+92" + digits;
}

function whatsappMessage(propertyTitle: string) {
  return encodeURIComponent(
    `Hi! I'm interested in your listing "${propertyTitle}" on GharDhoondo. Could you share more details?`
  );
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { properties, deleteProperty, addTransaction } = useProperties();
  const [currentImg, setCurrentImg] = useState(0);

  const property = properties.find((p) => p.id === id);
  const isOwner = user?.id === property?.ownerId;
  const canMessage = !!property?.ownerId && property.ownerId.trim().length > 0;

  if (!property) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.text }]}>Property not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const phone = sanitizePhone(property.ownerPhone ?? "");

  const requireLogin = (action: string, callback: () => void) => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        `You need a GharDhoondo account to ${action}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            style: "default",
            onPress: () => router.push("/auth/login"),
          },
        ]
      );
      return;
    }
    callback();
  };

  const handleCall = () => {
    requireLogin("call the owner", async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!phone) {
        Alert.alert("No Phone", "The owner has not added a phone number.");
        return;
      }
      try {
        await Linking.openURL(`tel:${phone}`);
      } catch {
        Alert.alert("Error", "Unable to open phone dialer.");
      }
    });
  };

  const handleWhatsApp = () => {
    requireLogin("message the owner on WhatsApp", async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!phone) {
        Alert.alert("No WhatsApp", "The owner has not added a phone number.");
        return;
      }
      const url = `https://wa.me/${phone}?text=${whatsappMessage(property.title)}`;
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Open WhatsApp", "Copy this link to open WhatsApp manually:", [
            { text: "Cancel", style: "cancel" },
            { text: "Copy Link", onPress: () => { /* clipboard not available in RN web easily */ } },
          ]);
        }
      } catch {
        Alert.alert("WhatsApp", "Unable to open WhatsApp. Please try calling instead.");
      }
    });
  };

  const handleMessage = () => {
    requireLogin("send a message", () => {
      if (!canMessage) {
        Alert.alert("No Chat Available", "This property owner hasn't registered for in-app messaging. Use WhatsApp or Call instead.");
        return;
      }
      router.push(
        `/chat/${property.id}?receiverId=${property.ownerId}&receiverName=${encodeURIComponent(property.ownerName)}&propertyTitle=${encodeURIComponent(property.title)}`
      );
    });
  };

  const handleMarkComplete = () => {
    requireLogin("update the status", () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Update Status",
        `Change this property to ${property.listingType === "sale" ? "Sold" : "Rented"}? Only the owner or admin can do this.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: property.listingType === "sale" ? "Mark as Sold" : "Mark as Rented",
            onPress: () => {
              addTransaction({
                propertyId: property.id,
                propertyTitle: property.title,
                propertyCity: property.city,
                propertyType: property.type,
                transactionType: property.listingType === "sale" ? "sale" : "rent",
                buyerOrRenterId: user!.id,
                buyerOrRenterName: user!.name,
                buyerOrRenterEmail: user!.email,
                sellerOrOwnerId: property.ownerId,
                sellerOrOwnerName: property.ownerName,
                sellerOrOwnerEmail: "",
                amount: property.price,
              });
              Alert.alert("Success", "Transaction recorded! The admin will be notified.");
            },
          },
        ]
      );
    });
  };

  const handleDelete = () => {
    Alert.alert("Delete Listing", "Remove this property from listings?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteProperty(property.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.backBtn, { top: topPad + 12 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: "rgba(255,255,255,0.9)" }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity
            style={[styles.backCircle, { backgroundColor: "#FEF2F2" }]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageSection}>
          {property.images && property.images.length > 0 ? (
            <>
              <Image source={{ uri: property.images[currentImg] }} style={styles.mainImage} resizeMode="cover" />
              {property.images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbsRow}>
                  {property.images.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setCurrentImg(i)} style={[styles.thumbWrap, i === currentImg && [styles.thumbActive, { borderColor: colors.primary }]]}>
                      <Image source={{ uri }} style={styles.thumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={[styles.noImageBox, { backgroundColor: colors.primaryLight }]}>
              <Feather name="home" size={64} color={colors.primary} />
              <Text style={[styles.noImageText, { color: colors.mutedForeground }]}>No photos uploaded</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(property.price, property.listingType)}</Text>
            <View style={[styles.badge, { backgroundColor: property.listingType === "sale" ? colors.primaryLight : "#FEF3C7" }]}>
              <Text style={[styles.badgeText, { color: property.listingType === "sale" ? colors.primary : "#F59E0B" }]}>
                {property.listingType === "sale" ? "For Sale" : "For Rent"}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{property.title}</Text>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{property.area}, {property.city}</Text>
          </View>

          {(property.bedrooms > 0 || property.bathrooms > 0 || property.size) && (
            <View style={[styles.specsRow, { backgroundColor: colors.muted, borderRadius: 14 }]}>
              {property.bedrooms > 0 && (
                <View style={styles.specItem}>
                  <Feather name="moon" size={18} color={colors.primary} />
                  <Text style={[styles.specVal, { color: colors.text }]}>{property.bedrooms}</Text>
                  <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Beds</Text>
                </View>
              )}
              {property.bathrooms > 0 && (
                <View style={styles.specItem}>
                  <Feather name="droplet" size={18} color={colors.primary} />
                  <Text style={[styles.specVal, { color: colors.text }]}>{property.bathrooms}</Text>
                  <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Baths</Text>
                </View>
              )}
              {!!property.size && (
                <View style={styles.specItem}>
                  <Feather name="maximize-2" size={18} color={colors.primary} />
                  <Text style={[styles.specVal, { color: colors.text }]}>{property.size}</Text>
                  <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Size</Text>
                </View>
              )}
            </View>
          )}

          {property.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]}>{property.description}</Text>
            </View>
          ) : null}

          <View style={[styles.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.ownerAvatar, { backgroundColor: colors.primaryLight }]}>
              {property.ownerAvatar ? (
                <Image source={{ uri: getObjectUrl(property.ownerAvatar) }} style={styles.ownerAvatarImg} />
              ) : (
                <Text style={[styles.ownerAvatarText, { color: colors.primary }]}>{property.ownerName?.[0]?.toUpperCase() ?? "O"}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ownerLabel, { color: colors.mutedForeground }]}>Listed by</Text>
              <Text style={[styles.ownerName, { color: colors.text }]}>{property.ownerName}</Text>
              {property.ownerPhone ? (
                <Text style={[styles.ownerPhone, { color: colors.mutedForeground }]}>{property.ownerPhone}</Text>
              ) : null}
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity
              onPress={handleMarkComplete}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                {property.listingType === "sale" ? "Mark as Sold" : "Mark as Rented"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.msgBtn, { backgroundColor: canMessage ? colors.primaryLight : colors.muted, opacity: canMessage ? 1 : 0.5 }]}
          onPress={handleMessage}
          activeOpacity={0.85}
        >
          <Feather name="message-circle" size={18} color={canMessage ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: "#22C55E" }]}
          onPress={handleWhatsApp}
          activeOpacity={0.85}
        >
          <Feather name="message-square" size={18} color="#fff" />
          <Text style={styles.callBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primary }]}
          onPress={handleCall}
          activeOpacity={0.85}
        >
          <Feather name="phone" size={18} color="#fff" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { position: "absolute", left: 16, zIndex: 10, flexDirection: "row", gap: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  imageSection: {},
  mainImage: { width, height: 280 },
  noImageBox: { height: 240, alignItems: "center", justifyContent: "center", gap: 8 },
  noImageText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  thumbsRow: { paddingHorizontal: 16, paddingVertical: 10 },
  thumbWrap: { marginRight: 8, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  thumbActive: {},
  thumb: { width: 60, height: 60 },
  content: { padding: 20 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  price: { fontSize: 24, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  location: { fontSize: 14, fontFamily: "Inter_400Regular" },
  specsRow: { flexDirection: "row", padding: 16, gap: 0, marginBottom: 20 },
  specItem: { flex: 1, alignItems: "center", gap: 4 },
  specVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  specLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 8 },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  ownerCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ownerAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  ownerAvatarText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  ownerLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  ownerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  ownerPhone: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, flexDirection: "row", gap: 10 },
  msgBtn: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  callBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  callBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  notFound: { fontSize: 18, fontFamily: "Inter_700Bold", marginVertical: 12 },
});
