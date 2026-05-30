import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { type ApiConversation, apiGetConversations } from "@/lib/api";
import { getObjectUrl } from "@/lib/storage";

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { conversations: convs } = await apiGetConversations();
      setConversations(convs);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Feather name="message-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.text, marginTop: 16 }]}>Sign In to View Messages</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground, textAlign: "center" }]}>
          You need an account to see your conversations with sellers and buyers
        </Text>
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => `${item.propertyId}-${item.otherPartyId}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap "Message" on any property listing to start chatting
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() =>
              router.push(
                `/chat/${item.propertyId}?receiverId=${item.otherPartyId}&receiverName=${encodeURIComponent(item.otherPartyName)}&propertyTitle=${encodeURIComponent(item.propertyTitle)}`
              )
            }
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              {item.otherPartyAvatar ? (
                <Image source={{ uri: getObjectUrl(item.otherPartyAvatar) }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>{item.otherPartyName[0]?.toUpperCase()}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={[styles.name, { color: colors.text }]}>{item.otherPartyName}</Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>
                  {new Date(item.lastMessageAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                </Text>
              </View>
              <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
              <Text style={[styles.meta, { color: colors.primary }]}>{item.propertyTitle} • {item.propertyCity}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 100, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  loginBtn: { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  time: { fontSize: 11, fontFamily: "Inter_400Regular" },
  preview: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
