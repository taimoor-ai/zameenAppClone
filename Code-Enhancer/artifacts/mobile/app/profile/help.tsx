import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQS = [
  { q: "How do I post a property?", a: "Go to the Post tab at the bottom, fill in your property details, add photos from your gallery, and tap Post Property. Your listing will appear immediately." },
  { q: "How do I filter properties by city?", a: "On the Search tab, tap the filter icon (sliders) to open the filter panel. Select a city, property type, or price range, then tap Show Results." },
  { q: "Can I change my role from Buyer to Seller?", a: "Yes! Go to Profile → Edit Profile and select your new role. Changes are saved instantly." },
  { q: "How do I contact a property owner?", a: "Open any property listing and tap the 'Contact Seller' or 'Contact Owner' button at the bottom of the screen." },
  { q: "Can I delete my listing?", a: "Yes, open your property listing and tap the trash icon in the top-right corner. You can only delete your own listings." },
  { q: "Is my data safe?", a: "Your data is stored locally on your device using secure storage. We don't share your information with third parties." },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24 }}>
        <View style={[styles.banner, { backgroundColor: colors.primaryLight }]}>
          <Feather name="help-circle" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.primary }]}>How can we help?</Text>
            <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>Browse the FAQs below for quick answers</Text>
          </View>
        </View>

        <Text style={[styles.faqTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: expanded === i ? colors.primary : colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              setExpanded((prev) => (prev === i ? null : i));
            }}
            activeOpacity={0.85}
          >
            <View style={styles.faqRow}>
              <Text style={[styles.faqQ, { color: colors.text }]}>{faq.q}</Text>
              <Feather name={expanded === i ? "chevron-up" : "chevron-down"} size={18} color={expanded === i ? colors.primary : colors.mutedForeground} />
            </View>
            {expanded === i && (
              <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.contactBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mail" size={24} color={colors.primary} />
          <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>Email us at support@ghardhoondo.pk</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  banner: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 18, marginBottom: 24 },
  bannerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bannerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  faqTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  faqCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 10 },
  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  faqA: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 10 },
  contactBox: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8, marginTop: 12 },
  contactTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  contactSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
