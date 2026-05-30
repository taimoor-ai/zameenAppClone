import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, UserRole } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getObjectUrl, uploadFile } from "@/lib/storage";

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "buyer", label: "Buyer", icon: "shopping-bag" },
  { value: "renter", label: "Renter", icon: "key" },
  { value: "seller", label: "Seller", icon: "tag" },
];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "buyer");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to upload a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const ext = asset.mimeType?.split("/")[1] ?? "jpg";
    const filename = `avatar.${ext}`;

    setUploading(true);
    try {
      const objectPath = await uploadFile(asset.uri, filename, asset.mimeType ?? "image/jpeg");
      setAvatar(objectPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      Alert.alert("Upload Error", msg);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateUser({ name: name.trim(), phone: phone.trim(), role, avatar });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Your profile has been updated.", [{ text: "OK", onPress: () => router.back() }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={loading || uploading}>
            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : (
              <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.avatarArea, { backgroundColor: colors.primaryLight }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {avatar ? (
                <Image source={{ uri: getObjectUrl(avatar) }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Feather name="camera" size={14} color={colors.primary} />
                  <Text style={[styles.uploadBtnText, { color: colors.primary }]}>Change Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="mail" size={18} color={colors.mutedForeground} />
              <Text style={[styles.input, { color: colors.mutedForeground }]}>{user?.email}</Text>
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Email cannot be changed</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="phone" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="03xx-xxxxxxx"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>My Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleCard,
                    { borderColor: role === r.value ? colors.primary : colors.border, backgroundColor: role === r.value ? colors.primaryLight : colors.card },
                  ]}
                  onPress={() => { setRole(r.value); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Feather name={r.icon as any} size={20} color={role === r.value ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.roleLabel, { color: role === r.value ? colors.primary : colors.text }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, (loading || uploading) && { opacity: 0.7 }]}
            onPress={save}
            disabled={loading || uploading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  saveText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  body: { padding: 20 },
  avatarArea: { alignItems: "center", borderRadius: 20, padding: 24, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff" },
  avatarName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  uploadBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 2, gap: 8 },
  roleLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
