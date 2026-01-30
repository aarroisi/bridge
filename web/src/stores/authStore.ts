import { create } from "zustand";
import { User } from "@/types";
import { api } from "@/lib/api";

interface ItemWithCreator {
  createdById?: string;
  createdBy?: { id: string } | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  // Permission helpers
  isOwner: () => boolean;
  canEdit: (item: ItemWithCreator) => boolean;
  canDelete: (item: ItemWithCreator) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const data = await api.post<{ user: User; token: string }>(
        "/auth/login",
        {
          email,
          password,
        },
      );
      api.setToken(data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      api.clearToken();
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await api.put<{ user: User }>("/auth/me", { user: data });
    set({ user: response.user });
  },

  // Permission helpers
  isOwner: (): boolean => {
    return useAuthStore.getState().user?.role === "owner";
  },

  canEdit: (item: ItemWithCreator): boolean => {
    const user = useAuthStore.getState().user;
    if (!user) return false;
    if (user.role === "owner") return true;
    // Members and guests can only edit their own items
    const creatorId = item.createdBy?.id || item.createdById;
    return creatorId === user.id;
  },

  canDelete: (item: ItemWithCreator): boolean => {
    const user = useAuthStore.getState().user;
    if (!user) return false;
    if (user.role === "owner") return true;
    // Members and guests can only delete their own items
    const creatorId = item.createdBy?.id || item.createdById;
    return creatorId === user.id;
  },
}));
