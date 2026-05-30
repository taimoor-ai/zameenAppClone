import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  type ApiProperty,
  type CreatePropertyInput,
  apiCreateProperty,
  apiCreateTransaction,
  apiDeleteProperty,
  apiGetAdminDashboard,
  apiGetProperties,
} from "../lib/api";

export type PropertyType = "house" | "apartment" | "plot" | "commercial" | "farmhouse";
export type ListingType = "sale" | "rent";
export type City = "Karachi" | "Lahore" | "Multan" | "Chakwal" | "Islamabad" | "Rawalpindi";

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  price: number;
  city: City | string;
  area: string;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  size: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerPhone: string;
  createdAt: string;
  featured: boolean;
}

export interface Transaction {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyType: string;
  transactionType: "sale" | "rent";
  buyerOrRenterId: string;
  buyerOrRenterName: string;
  buyerOrRenterEmail: string;
  sellerOrOwnerId: string;
  sellerOrOwnerName: string;
  sellerOrOwnerEmail: string;
  amount: number;
  date: string;
}

function apiToProperty(p: ApiProperty): Property {
  return {
    id: p.id,
    title: p.title,
    type: p.propertyType as PropertyType,
    listingType: p.listingType,
    price: p.price,
    city: p.city as City,
    area: p.area,
    description: p.description,
    images: p.images ?? [],
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    size: p.areaSize,
    ownerId: p.sellerId ?? "",
    ownerName: p.ownerName,
    ownerAvatar: p.ownerAvatar ?? "",
    ownerPhone: p.ownerPhone,
    createdAt: p.createdAt,
    featured: p.featured,
  };
}

function localToApi(p: Omit<Property, "id" | "createdAt">): CreatePropertyInput {
  return {
    title: p.title,
    description: p.description,
    listingType: p.listingType,
    propertyType: p.type,
    price: p.price,
    areaSize: p.size,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    city: p.city,
    area: p.area,
    featured: p.featured,
    images: p.images,
  };
}

interface PropertiesContextType {
  properties: Property[];
  transactions: Transaction[];
  isLoading: boolean;
  addProperty: (p: Omit<Property, "id" | "createdAt">) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "date">) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextType | null>(null);

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { properties: apiProps } = await apiGetProperties();
      setProperties(apiProps.map(apiToProperty));
    } catch {
      // keep existing state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProperty = useCallback(async (p: Omit<Property, "id" | "createdAt">) => {
    const apiInput = localToApi(p);
    const { property: created } = await apiCreateProperty(apiInput);
    setProperties((prev) => [apiToProperty(created), ...prev]);
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    await apiDeleteProperty(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, "id" | "date">) => {
    try {
      await apiCreateTransaction({
        propertyId: t.propertyId,
        propertyTitle: t.propertyTitle,
        propertyCity: t.propertyCity,
        propertyType: t.propertyType,
        transactionType: t.transactionType,
        amountTransacted: t.amount,
        sellerOrOwnerId: t.sellerOrOwnerId,
        sellerOrOwnerName: t.sellerOrOwnerName,
        sellerOrOwnerEmail: t.sellerOrOwnerEmail,
      });
    } catch {
      // silently fail — record locally at minimum
    }
    const localTx: Transaction = {
      ...t,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, localTx]);
  }, []);

  const refreshProperties = useCallback(async () => {
    setIsLoading(true);
    await load();
  }, [load]);

  const refreshTransactions = useCallback(async () => {
    try {
      const dashboard = await apiGetAdminDashboard();
      const txs: Transaction[] = dashboard.transactions.map((t) => ({
        id: t.id,
        propertyId: "",
        propertyTitle: t.propertyTitle,
        propertyCity: t.propertyCity,
        propertyType: t.propertyType,
        transactionType: t.transactionType === "rent_lease" ? "rent" : "sale",
        buyerOrRenterId: "",
        buyerOrRenterName: t.buyerOrRenterName,
        buyerOrRenterEmail: t.buyerOrRenterEmail,
        sellerOrOwnerId: "",
        sellerOrOwnerName: t.sellerOrOwnerName,
        sellerOrOwnerEmail: t.sellerOrOwnerEmail,
        amount: t.amount,
        date: t.transactedAt,
      }));
      setTransactions(txs);
    } catch {
      // not admin or network error
    }
  }, []);

  useEffect(() => { refreshTransactions(); }, [refreshTransactions]);

  return (
    <PropertiesContext.Provider value={{ properties, transactions, isLoading, addProperty, deleteProperty, addTransaction, refreshProperties }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used within PropertiesProvider");
  return ctx;
}
