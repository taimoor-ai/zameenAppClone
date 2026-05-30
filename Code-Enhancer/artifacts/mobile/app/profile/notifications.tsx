import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const NOTIFICATIONS = [
  { id: "1", icon: "bell", title: "Welcome to GharDhoondo!", body: "Start browsing thousands of properties across Pakistan.", time: "Just now", read: false },
  { id: "2", icon: "home", title: "New listings in Lahore", body: "5 new properties have been listed in your preferred city.", time: "2h ago", read: false },
  { id: "3", icon: "star", title: "Property saved", body: "You saved 'Modern House in DHA' to your favourites.", time: "1d ago", read: true },
  { id: "4", icon: "tag", title: "Price drop alert", body: "A property you viewed has reduced its price by 10%.", time: "3d ago", read: true },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === "web" ? 34 : 24 }}>
        {NOTIFICATIONS.map((n) => (
          <View
            key={n.id}
            style={[
              styles.item,
              { backgroundColor: n.read ? colors.background : colors.primaryLight, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: n.read ? colors.muted : colors.primary + "30" }]}>
              <Feather name={n.icon as any} size={18} color={n.read ? colors.mutedForeground : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.text }, !n.read && { fontFamily: "Inter_600SemiBold" }]}>{n.title}</Text>
              <Text style={[styles.itemBody, { color: colors.mutedForeground }]}>{n.body}</Text>
            </View>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>{n.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 2 },
  itemBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
