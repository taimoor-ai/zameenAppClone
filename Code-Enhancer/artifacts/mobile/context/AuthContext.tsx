import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  type ApiUser,
  apiGetAdminDashboard,
  apiGetMe,
  apiLogin,
  apiRegister,
  apiUpdateMe,
  clearToken,
  saveToken,
} from "../lib/api";

export type UserRole = "buyer" | "renter" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  avatar: string;
  createdAt: string;
}

const CURRENT_USER_KEY = "ghardhoondo_current_user";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  allUsers: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function apiUserToLocal(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: "",
    role: u.role as UserRole,
    phone: u.phone ?? "",
    avatar: u.avatar ?? "",
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (cached) {
          const parsed: User = JSON.parse(cached);
          setUser(parsed);
          try {
            const { user: fresh } = await apiGetMe();
            const updated = apiUserToLocal(fresh);
            setUser(updated);
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
          } catch {
            // keep cached user if token expired
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: apiUser } = await apiLogin(email.trim(), password);
      await saveToken(token);
      const localUser = apiUserToLocal(apiUser);
      setUser(localUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUser));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone: string, role: UserRole) => {
    try {
      const apiRole = (role === "admin" ? "buyer" : role) as "buyer" | "seller" | "renter";
      const { token, user: apiUser } = await apiRegister(name, email.trim(), password, phone, apiRole);
      await saveToken(token);
      const localUser = apiUserToLocal(apiUser);
      setUser(localUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUser));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setAllUsers([]);
    await Promise.all([clearToken(), AsyncStorage.removeItem(CURRENT_USER_KEY)]);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const { user: updated } = await apiUpdateMe({
        name: updates.name,
        phone: updates.phone,
        role: updates.role as "buyer" | "seller" | "renter" | undefined,
      });
      const localUpdated = apiUserToLocal(updated);
      setUser(localUpdated);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUpdated));
    } catch {
      const updated = { ...user, ...updates };
      setUser(updated);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    }
  }, [user]);

  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const dashboard = await apiGetAdminDashboard();
      const users: User[] = dashboard.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: "",
        role: u.role as UserRole,
        phone: u.phone ?? "",
        avatar: (u as any).avatar ?? "",
        createdAt: u.createdAt,
      }));
      setAllUsers(users);
    } catch {
      // silently fail
    }
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, allUsers, isLoading, login, register, logout, updateUser, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
