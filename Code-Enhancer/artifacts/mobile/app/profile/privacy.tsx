import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "Data Privacy",
    items: [
      { icon: "eye-off", text: "Your personal information is stored securely on your device and is never shared with third parties without consent." },
      { icon: "lock", text: "All passwords are stored locally using secure AsyncStorage. We recommend using a strong, unique password." },
    ],
  },
  {
    title: "Account Security",
    items: [
      { icon: "shield", text: "Your account is protected by the credentials you provided during registration." },
      { icon: "log-out", text: "Always sign out when using a shared device to protect your account." },
    ],
  },
  {
    title: "Property Listings",
    items: [
      { icon: "home", text: "Property details you post are visible to all users of GharDhoondo." },
      { icon: "phone", text: "Your phone number on listings is only visible when a user views a property detail." },
    ],
  },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24 }}>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          GharDhoondo is committed to protecting your privacy. Here's how we handle your data.
        </Text>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{sec.title}</Text>
            {sec.items.map((item, i) => (
              <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  intro: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
