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

import { useAuth, UserRole } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: "buyer", label: "Buyer", icon: "shopping-bag", desc: "Looking to buy" },
  { value: "renter", label: "Renter", icon: "key", desc: "Looking to rent" },
  { value: "seller", label: "Seller", icon: "tag", desc: "Listing properties" },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await register(name, email, password, phone, role);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Registration failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#064E3B", "#059669"]} style={[styles.gradient, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.gradTitle}>Create Account</Text>
        <Text style={styles.gradSub}>Join GharDhoondo today</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={[styles.form, { backgroundColor: colors.background }]}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: "Full Name", value: name, setter: setName, icon: "user", placeholder: "Your full name", type: "default" as const },
            { label: "Email", value: email, setter: setEmail, icon: "mail", placeholder: "Email address", type: "email-address" as const },
            { label: "Phone", value: phone, setter: setPhone, icon: "phone", placeholder: "03xx-xxxxxxx", type: "phone-pad" as const },
          ].map((field) => (
            <View key={field.label}>
              <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name={field.icon as any} size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.type}
                  autoCapitalize={field.type === "default" ? "words" : "none"}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Create password"
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

          <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm password"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>I am a...</Text>
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
                <Feather name={r.icon as any} size={22} color={role === r.value ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.roleLabel, { color: role === r.value ? colors.primary : colors.text }]}>{r.label}</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingHorizontal: 24, paddingBottom: 28 },
  back: { marginBottom: 16 },
  gradTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  gradSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", marginTop: 4 },
  form: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  formContent: { padding: 24 },
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
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  roleCard: {
    flex: 1, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 2, gap: 6,
  },
  roleLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  roleDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  loginLink: { alignItems: "center" },
  loginText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
