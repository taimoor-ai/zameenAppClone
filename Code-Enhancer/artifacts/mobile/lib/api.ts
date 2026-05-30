import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "ghardhoondo_jwt";

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  // if (!domain) return "/api";
  // if (Platform.OS === "web") return "/api";
  return `http://localhost:5000/api`;
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "seller" | "renter" | "admin";
  avatar: string;
}

interface AuthResponse { token: string; user: ApiUser }

export async function apiRegister(name: string, email: string, password: string, phone: string, role: string): Promise<AuthResponse> {
  return request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, phone, role }) });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function apiGetMe(): Promise<{ user: ApiUser }> {
  return request("/auth/me");
}

export async function apiUpdateMe(updates: Partial<Pick<ApiUser, "name" | "phone" | "role" | "avatar">>): Promise<{ user: ApiUser }> {
  return request("/auth/me", { method: "PUT", body: JSON.stringify(updates) });
}

export async function apiGetUploadUrl(
  filename: string,
  contentType: string,
): Promise<{ presignedUrl: string; objectPath: string }> {
  return request("/storage/uploads/request-url", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}

// ─── Properties ─────────────────────────────────────────────────────────────────

export interface ApiProperty {
  id: string;
  sellerId?: string;
  title: string;
  description: string;
  listingType: "sale" | "rent";
  propertyType: "house" | "apartment" | "plot" | "commercial" | "farmhouse";
  price: number;
  areaSize: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  area: string;
  status: string;
  featured: boolean;
  ownerName: string;
  ownerPhone: string;
  ownerAvatar: string;
  images: string[];
  createdAt: string;
}

export interface PropertyFilters {
  listingType?: "sale" | "rent";
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function apiGetProperties(filters: PropertyFilters = {}): Promise<{ properties: ApiProperty[] }> {
  const params = new URLSearchParams();
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.city) params.set("city", filters.city);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  const qs = params.toString();
  return request(`/properties${qs ? `?${qs}` : ""}`);
}

export async function apiGetProperty(id: string): Promise<{ property: ApiProperty }> {
  return request(`/properties/${id}`);
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  listingType: "sale" | "rent";
  propertyType: "house" | "apartment" | "plot" | "commercial" | "farmhouse";
  price: number;
  areaSize: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  area: string;
  featured: boolean;
  images: string[];
}

export async function apiCreateProperty(data: CreatePropertyInput): Promise<{ property: ApiProperty }> {
  return request("/properties", { method: "POST", body: JSON.stringify(data) });
}

export async function apiDeleteProperty(id: string): Promise<void> {
  return request(`/properties/${id}`, { method: "DELETE" });
}

export async function apiUpdatePropertyStatus(id: string, status: "available" | "sold" | "rented"): Promise<{ success: boolean; status: string }> {
  return request(`/properties/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

// ─── Saved Properties ─────────────────────────────────────────────────────────

export async function apiGetSaved(): Promise<{ properties: ApiProperty[] }> {
  return request("/saved");
}

export async function apiSaveProperty(propertyId: string): Promise<void> {
  return request(`/saved/${propertyId}`, { method: "POST" });
}

export async function apiUnsaveProperty(propertyId: string): Promise<void> {
  return request(`/saved/${propertyId}`, { method: "DELETE" });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function apiCreateTransaction(data: {
  propertyId?: string;
  propertyTitle: string;
  propertyCity: string;
  propertyType: string;
  transactionType: "sale" | "rent";
  amountTransacted: number;
  sellerOrOwnerId?: string;
  sellerOrOwnerName: string;
  sellerOrOwnerEmail: string;
}): Promise<void> {
  return request("/transactions", { method: "POST", body: JSON.stringify(data) });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  stats: { totalUsers: number; totalProperties: number; totalTransactions: number; totalCities: number };
  users: { id: string; name: string; email: string; phone: string; role: string; createdAt: string }[];
  transactions: {
    id: string; transactionType: string; amount: number; transactedAt: string;
    propertyTitle: string; propertyCity: string; propertyType: string;
    sellerOrOwnerName: string; sellerOrOwnerEmail: string;
    buyerOrRenterName: string; buyerOrRenterEmail: string;
  }[];
}

export async function apiGetAdminDashboard(): Promise<AdminDashboard> {
  return request("/admin/dashboard");
}

// ─── Messages ──────────────────────────────────────────────────────────────

export interface ApiMessage {
  id: string;
  propertyId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: string;
}

export interface ApiConversation {
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
}

export async function apiGetMessages(propertyId: string): Promise<{ messages: ApiMessage[] }> {
  return request(`/messages?propertyId=${encodeURIComponent(propertyId)}`);
}

export async function apiSendMessage(propertyId: string, receiverId: string, content: string): Promise<{ message: ApiMessage }> {
  return request("/messages", { method: "POST", body: JSON.stringify({ propertyId, receiverId, content }) });
}

export async function apiGetConversations(): Promise<{ conversations: ApiConversation[] }> {
  return request("/messages/conversations");
}
