import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useFavourites } from "@/context/FavouritesContext";
import { useColors } from "@/hooks/useColors";
import { getObjectUrl } from "@/lib/storage";

const ROLE_COLORS: Record<string, string> = {
  buyer: "#3B82F6",
  renter: "#8B5CF6",
  seller: "#059669",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { favouriteIds } = useFavourites();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const MenuItem = ({
    icon, label, onPress, danger = false, badge,
  }: {
    icon: string; label: string; onPress: () => void; danger?: boolean; badge?: number;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#FEF2F2" : colors.primaryLight }]}>
        <Feather name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.destructive : colors.text }]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {!danger && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] ?? colors.primary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: topPad + 20, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
          {user.avatar ? (
            <Image source={{ uri: getObjectUrl(user.avatar) }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>{user.name?.[0]?.toUpperCase() ?? "U"}</Text>
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
        {user.phone ? <Text style={[styles.phone, { color: colors.mutedForeground }]}>{user.phone}</Text> : null}
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "20" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          onPress={() => { Haptics.selectionAsync(); router.push("/profile/edit"); }}
          activeOpacity={0.85}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>My Activity</Text>
        <MenuItem
          icon="heart"
          label="Saved Properties"
          badge={favouriteIds.length}
          onPress={() => router.push("/profile/saved")}
        />
        <MenuItem icon="list" label="My Listings" onPress={() => router.push("/profile/listings")} />
        <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/profile/notifications")} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Support</Text>
        <MenuItem icon="shield" label="Privacy & Security" onPress={() => router.push("/profile/privacy")} />
        <MenuItem icon="help-circle" label="Help Center" onPress={() => router.push("/profile/help")} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="log-out" label="Sign Out" onPress={handleLogout} danger />
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>GharDhoondo v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, marginBottom: 16 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 34, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  email: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 2 },
  phone: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 10 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5 },
  editBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  badgePill: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", paddingVertical: 16 },
});
