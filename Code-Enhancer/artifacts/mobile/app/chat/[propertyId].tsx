import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { type ApiMessage, apiGetMessages, apiSendMessage } from "@/lib/api";
import { getObjectUrl } from "@/lib/storage";

interface BubbleGroup {
  date: string;
  items: ApiMessage[];
}

function groupByDate(messages: ApiMessage[]): BubbleGroup[] {
  const groups: Record<string, ApiMessage[]> = {};
  for (const m of messages) {
    const d = new Date(m.createdAt).toDateString();
    if (!groups[d]) groups[d] = [];
    groups[d].push(m);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export default function ChatScreen() {
  const { propertyId, receiverId, receiverName, propertyTitle } = useLocalSearchParams<{
    propertyId: string;
    receiverId: string;
    receiverName: string;
    propertyTitle: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { messages: apiMessages } = await apiGetMessages(propertyId);
      setMessages((prev) => {
        if (prev.length === apiMessages.length) return prev;
        return apiMessages;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load messages";
      if (!silent) Alert.alert("Error", msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { message } = await apiSendMessage(propertyId, receiverId, trimmed);
      setMessages((prev) => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      Alert.alert("Error", msg);
    } finally {
      setSending(false);
    }
  };

  const isMe = (m: ApiMessage) => m.senderId === user?.id;
  const groups = groupByDate(messages);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const renderItem = ({ item }: { item: BubbleGroup }) => (
    <View>
      <View style={styles.dateWrap}>
        <View style={[styles.datePill, { backgroundColor: colors.muted }]}>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDateLabel(item.date)}</Text>
        </View>
      </View>
      {item.items.map((msg) => {
        const mine = isMe(msg);
        return (
          <View key={msg.id} style={[styles.msgRow, mine ? styles.msgRight : styles.msgLeft]}>
            {!mine && (
              <View style={[styles.avatarSmall, { backgroundColor: colors.primaryLight }]}>
                {msg.senderAvatar ? (
                  <Image source={{ uri: getObjectUrl(msg.senderAvatar) }} style={styles.avatarSmallImg} />
                ) : (
                  <Text style={[styles.avatarSmallText, { color: colors.primary }]}>{msg.senderName[0]?.toUpperCase()}</Text>
                )}
              </View>
            )}
            <View style={[styles.bubble, mine ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              {!mine && (
                <Text style={[styles.senderName, { color: colors.primary }]}>{msg.senderName}</Text>
              )}
              <Text style={[styles.bubbleText, { color: mine ? "#fff" : colors.text }]}>{msg.content}</Text>
              <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                {new Date(msg.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {decodeURIComponent(receiverName)}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {propertyTitle ? decodeURIComponent(propertyTitle) : "Property Inquiry"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groups}
          keyExtractor={(g) => g.date}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Say hello to start the conversation about this property
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}

      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: text.trim() && !sending ? 1 : 0.45 }]}
          onPress={send}
          disabled={!text.trim() || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  dateWrap: { alignItems: "center", marginVertical: 12 },
  datePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  dateText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10, maxWidth: "85%" },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 6, overflow: "hidden" },
  avatarSmallImg: { width: 28, height: 28, borderRadius: 14 },
  avatarSmallText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  senderName: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
