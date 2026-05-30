import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { City, ListingType, PropertyType, useProperties } from "@/context/PropertiesContext";
import { useColors } from "@/hooks/useColors";

const CITIES: City[] = ["Karachi", "Lahore", "Multan", "Chakwal", "Islamabad", "Rawalpindi"];
const PROP_TYPES: PropertyType[] = ["house", "apartment", "plot", "commercial", "farmhouse"];

export default function PostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addProperty } = useProperties();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<PropertyType>("house");
  const [listingType, setListingType] = useState<ListingType>("sale");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState<City>("Karachi");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("0");
  const [bathrooms, setBathrooms] = useState("0");
  const [size, setSize] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 6));
      Haptics.selectionAsync();
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    Haptics.selectionAsync();
  };

  const submit = async () => {
    if (!title.trim() || !price || !area.trim()) {
      Alert.alert("Missing Fields", "Please fill in title, price, and area.");
      return;
    }
    if (!user) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addProperty({
      title: title.trim(),
      type,
      listingType,
      price: parseFloat(price) || 0,
      city,
      area: area.trim(),
      description: description.trim(),
      images,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      size: size.trim(),
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatar ?? "",
      ownerPhone: user.phone,
      featured: false,
    });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Listed!", "Your property has been posted successfully.", [
      { text: "View Listings", onPress: () => router.push("/(tabs)") },
    ]);
    setTitle(""); setPrice(""); setArea(""); setDescription(""); setImages([]);
    setSize(""); setBedrooms("0"); setBathrooms("0");
  };

  const Selector = <T extends string>({ value, options, onChange, label }: { value: T; options: T[]; onChange: (v: T) => void; label: string }) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              { borderColor: value === opt ? colors.primary : colors.border, backgroundColor: value === opt ? colors.primaryLight : colors.card },
            ]}
            onPress={() => { onChange(opt); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: value === opt ? colors.primary : colors.mutedForeground }]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Post Property</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>List your property for buyers and renters</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Property Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageWrap}>
                  <Image source={{ uri }} style={styles.imgThumb} />
                  <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 6 && (
                <TouchableOpacity
                  style={[styles.addImg, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={pickImages}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={22} color={colors.primary} />
                  <Text style={[styles.addImgText, { color: colors.mutedForeground }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g. Modern 3-bedroom house in DHA"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Listing Type</Text>
          <View style={styles.listingRow}>
            {(["sale", "rent"] as ListingType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.listingBtn,
                  { borderColor: listingType === t ? colors.primary : colors.border, backgroundColor: listingType === t ? colors.primaryLight : colors.card },
                ]}
                onPress={() => { setListingType(t); Haptics.selectionAsync(); }}
              >
                <Feather name={t === "sale" ? "tag" : "key"} size={18} color={listingType === t ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.listingBtnText, { color: listingType === t ? colors.primary : colors.text }]}>
                  {t === "sale" ? "For Sale" : "For Rent"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Selector value={type} options={PROP_TYPES} onChange={setType} label="Property Type" />
        <Selector value={city} options={CITIES} onChange={setCity} label="City" />

        <View style={styles.row2}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price (PKR)</Text>
            <TextInput
              style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              placeholder="e.g. 15000000"
              placeholderTextColor={colors.mutedForeground}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Size</Text>
            <TextInput
              style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              placeholder="e.g. 5 Marla"
              placeholderTextColor={colors.mutedForeground}
              value={size}
              onChangeText={setSize}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Area / Neighbourhood</Text>
          <TextInput
            style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g. DHA Phase 5"
            placeholderTextColor={colors.mutedForeground}
            value={area}
            onChangeText={setArea}
          />
        </View>

        <View style={styles.row2}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
            <TextInput
              style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
            <TextInput
              style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text, height: 100, textAlignVertical: "top" }]}
            placeholder="Describe your property..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Feather name="upload" size={18} color="#fff" />
              <Text style={styles.submitText}>Post Property</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  body: { padding: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  inputBox: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  imagesRow: { flexDirection: "row", gap: 10 },
  imageWrap: { position: "relative" },
  imgThumb: { width: 90, height: 90, borderRadius: 12 },
  removeImg: {
    position: "absolute", top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  addImg: {
    width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  addImgText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  selectorScroll: { marginTop: 0 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  listingRow: { flexDirection: "row", gap: 12 },
  listingBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2,
  },
  listingBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  row2: { flexDirection: "row", gap: 12 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
