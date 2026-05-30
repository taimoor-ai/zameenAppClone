import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiGetSaved, apiSaveProperty, apiUnsaveProperty } from "../lib/api";
import { type Property } from "./PropertiesContext";

const FAVS_KEY = "ghardhoondo_favourites";

interface FavouritesContextType {
  favouriteIds: string[];
  savedProperties: Property[];
  isFavourite: (id: string) => boolean;
  toggleFavourite: (id: string, property?: Property) => Promise<void>;
  clearFavourites: () => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextType | null>(null);

function apiToLocalProperty(p: Record<string, unknown>): Property {
  return {
    id: String(p.id ?? ""),
    title: String(p.title ?? ""),
    type: String(p.property_type ?? p.propertyType ?? "house") as Property["type"],
    listingType: String(p.listing_type ?? p.listingType ?? "sale") as Property["listingType"],
    price: Number(p.price ?? 0),
    city: String(p.city ?? ""),
    area: String(p.area ?? ""),
    description: String(p.description ?? ""),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    bedrooms: Number(p.bedrooms ?? 0),
    bathrooms: Number(p.bathrooms ?? 0),
    size: String(p.area_size ?? p.areaSize ?? ""),
    ownerId: String(p.seller_id ?? p.sellerId ?? ""),
    ownerName: String(p.owner_name ?? p.ownerName ?? ""),
    ownerAvatar: String(p.owner_avatar ?? p.ownerAvatar ?? ""),
    ownerPhone: String(p.owner_phone ?? p.ownerPhone ?? ""),
    createdAt: String(p.created_at ?? p.createdAt ?? new Date().toISOString()),
    featured: Boolean(p.featured),
  };
}

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);

  const loadFromApi = useCallback(async () => {
    try {
      const { properties } = await apiGetSaved();
      setSavedProperties(properties.map((p) => apiToLocalProperty(p as unknown as Record<string, unknown>)));
      const ids = properties.map((p) => p.id);
      setFavouriteIds(ids);
      await AsyncStorage.setItem(FAVS_KEY, JSON.stringify(ids));
    } catch {
      const raw = await AsyncStorage.getItem(FAVS_KEY);
      if (raw) setFavouriteIds(JSON.parse(raw));
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const isFavourite = useCallback((id: string) => favouriteIds.includes(id), [favouriteIds]);

  const toggleFavourite = useCallback(async (id: string, property?: Property) => {
    const alreadySaved = favouriteIds.includes(id);
    try {
      if (alreadySaved) {
        await apiUnsaveProperty(id);
        setFavouriteIds((prev) => {
          const next = prev.filter((x) => x !== id);
          AsyncStorage.setItem(FAVS_KEY, JSON.stringify(next));
          return next;
        });
        setSavedProperties((prev) => prev.filter((p) => p.id !== id));
      } else {
        await apiSaveProperty(id);
        setFavouriteIds((prev) => {
          const next = [...prev, id];
          AsyncStorage.setItem(FAVS_KEY, JSON.stringify(next));
          return next;
        });
        if (property) {
          setSavedProperties((prev) => [property, ...prev]);
        }
      }
    } catch {
      // if not authenticated, fall back to local-only
      setFavouriteIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        AsyncStorage.setItem(FAVS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [favouriteIds]);

  const clearFavourites = useCallback(async () => {
    try {
      await Promise.all(favouriteIds.map((id) => apiUnsaveProperty(id)));
    } catch { /* ignore */ }
    setFavouriteIds([]);
    setSavedProperties([]);
    await AsyncStorage.removeItem(FAVS_KEY);
  }, [favouriteIds]);

  return (
    <FavouritesContext.Provider value={{ favouriteIds, savedProperties, isFavourite, toggleFavourite, clearFavourites }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
