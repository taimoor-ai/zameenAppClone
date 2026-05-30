import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
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

type Tab = "users" | "transactions";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { allUsers, logout } = useAuth();
  const { properties, transactions } = useProperties();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    console.log("i am called")
    Alert.alert("Sign Out", "Exit admin panel?", [
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

  const ROLE_COLORS: Record<string, string> = { buyer: "#3B82F6", renter: "#8B5CF6", seller: "#059669" };

  const stats = [
    { label: "Users", value: allUsers.length, icon: "users", color: "#3B82F6" },
    { label: "Listings", value: properties.length, icon: "home", color: "#059669" },
    { label: "Transactions", value: transactions.length, icon: "repeat", color: "#F59E0B" },
    { label: "Cities", value: [...new Set(properties.map((p) => p.city))].length, icon: "map-pin", color: "#8B5CF6" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: "#DC2626", paddingBottom: 20 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.adminLabel}>Admin Panel</Text>
            <Text style={styles.adminTitle}>GharDhoondo</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Feather name={s.icon as any} size={20} color="#fff" />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["users", "transactions"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && [styles.tabBtnActive, { borderBottomColor: "#DC2626" }]]}
            onPress={() => { setActiveTab(t); Haptics.selectionAsync(); }}
          >
            <Feather
              name={t === "users" ? "users" : "repeat"}
              size={16}
              color={activeTab === t ? "#DC2626" : colors.mutedForeground}
            />
            <Text style={[styles.tabText, { color: activeTab === t ? "#DC2626" : colors.mutedForeground }]}>
              {t === "users" ? "Users Directory" : "Transaction Records"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "users" ? (
        <FlatList
          data={allUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No registered users yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.userAvatar, { backgroundColor: (ROLE_COLORS[item.role] ?? colors.primary) + "20" }]}>
                {(item as any).avatar ? (
                  <Image source={{ uri: getObjectUrl((item as any).avatar) }} style={styles.userAvatarImg} />
                ) : (
                  <Text style={[styles.userAvatarText, { color: ROLE_COLORS[item.role] ?? colors.primary }]}>
                    {item.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{item.email}</Text>
                {item.phone ? <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{item.phone}</Text> : null}
              </View>
              <View>
                <View style={[styles.rolePill, { backgroundColor: (ROLE_COLORS[item.role] ?? colors.primary) + "20" }]}>
                  <Text style={[styles.rolePillText, { color: ROLE_COLORS[item.role] ?? colors.primary }]}>
                    {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                  </Text>
                </View>
                <Text style={[styles.joinDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "2-digit" })}
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="repeat" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions recorded yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Transactions appear when users mark a property as sold/rented
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.txHeader}>
                <View style={[styles.txBadge, { backgroundColor: item.transactionType === "sale" ? colors.primaryLight : "#FEF3C7" }]}>
                  <Feather name={item.transactionType === "sale" ? "tag" : "key"} size={12} color={item.transactionType === "sale" ? colors.primary : "#F59E0B"} />
                  <Text style={[styles.txBadgeText, { color: item.transactionType === "sale" ? colors.primary : "#F59E0B" }]}>
                    {item.transactionType === "sale" ? "Sale" : "Rental"}
                  </Text>
                </View>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                  {new Date(item.date).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              <Text style={[styles.txPropTitle, { color: colors.text }]}>{item.propertyTitle}</Text>
              <Text style={[styles.txLocation, { color: colors.mutedForeground }]}>{item.propertyCity} · {item.propertyType}</Text>
              <Text style={[styles.txAmount, { color: colors.primary }]}>
                PKR {item.amount.toLocaleString()}
              </Text>
              <View style={[styles.txDivider, { borderColor: colors.border }]} />
              <View style={styles.txParties}>
                <View style={styles.txParty}>
                  <Text style={[styles.txPartyLabel, { color: colors.mutedForeground }]}>
                    {item.transactionType === "sale" ? "Buyer" : "Renter"}
                  </Text>
                  <Text style={[styles.txPartyName, { color: colors.text }]}>{item.buyerOrRenterName}</Text>
                  <Text style={[styles.txPartyEmail, { color: colors.mutedForeground }]}>{item.buyerOrRenterEmail}</Text>
                </View>
                <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
                <View style={[styles.txParty, { alignItems: "flex-end" }]}>
                  <Text style={[styles.txPartyLabel, { color: colors.mutedForeground }]}>
                    {item.transactionType === "sale" ? "Seller" : "Owner"}
                  </Text>
                  <Text style={[styles.txPartyName, { color: colors.text }]}>{item.sellerOrOwnerName}</Text>
                  <Text style={[styles.txPartyEmail, { color: colors.mutedForeground }]}>{item.sellerOrOwnerEmail}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  adminLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_500Medium" },
  adminTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", borderRadius: 14, padding: 12, gap: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: {},
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  userAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userPhone: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 4, alignItems: "center" },
  rolePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  joinDate: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  txCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12 },
  txHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  txBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  txBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txPropTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  txLocation: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  txAmount: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10 },
  txDivider: { borderTopWidth: 1, marginBottom: 10 },
  txParties: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  txParty: { gap: 2 },
  txPartyLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  txPartyName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txPartyEmail: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
