import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isAdmin = email.trim().toLowerCase() === "tehzeeb.x51214@gmail.com";
    if (isAdmin) router.replace("/admin/dashboard");
    else router.replace("/(tabs)");
  };

  const fillAdmin = () => {
    setEmail("tehzeeb.x51214@gmail.com");
    setPassword("141161");
    setIsAdminMode(true);
    Haptics.selectionAsync();
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#064E3B", "#059669", "#34D399"]}
        style={[styles.gradient, { paddingTop: insets.top + 40 }]}
      >
        <View style={styles.brandArea}>
          <View style={styles.iconWrap}>
            <Feather name="home" size={36} color="#fff" />
          </View>
          <Text style={styles.brandName}>GharDhoondo</Text>
          <Text style={styles.brandTagline}>Find Your Perfect Home</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={[styles.form, { backgroundColor: colors.background }]}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isAdminMode && { backgroundColor: colors.primary }]}
              onPress={() => { setIsAdminMode(false); setError(""); }}
            >
              <Feather name="user" size={14} color={!isAdminMode ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: !isAdminMode ? "#fff" : colors.mutedForeground }]}>User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isAdminMode && { backgroundColor: "#DC2626" }]}
              onPress={fillAdmin}
            >
              <Feather name="shield" size={14} color={isAdminMode ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: isAdminMode ? "#fff" : colors.mutedForeground }]}>Admin</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.heading, { color: colors.text }]}>
            {isAdminMode ? "Admin Login" : "Welcome Back"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {isAdminMode ? "Access the admin panel" : "Sign in to your account"}
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.loginBtn,
              { backgroundColor: isAdminMode ? "#DC2626" : colors.primary },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{isAdminMode ? "Access Admin Panel" : "Sign In"}</Text>
            )}
          </TouchableOpacity>

          {!isAdminMode && (
            <TouchableOpacity style={styles.registerLink} onPress={() => router.push("/auth/register")}>
              <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
                Don't have an account?{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Register</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingHorizontal: 24, paddingBottom: 40 },
  brandArea: { alignItems: "center", gap: 8 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1 },
  brandTagline: { fontSize: 15, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  form: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  formContent: { padding: 24 },
  toggleRow: {
    flexDirection: "row", gap: 8, backgroundColor: "#F1F5F9",
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  toggleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  heading: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorText: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 16,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  loginBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: "center",
    marginTop: 8, marginBottom: 20,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  registerLink: { alignItems: "center" },
  registerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
