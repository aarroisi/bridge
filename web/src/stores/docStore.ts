import { create } from "zustand";
import { Doc } from "@/types";
import { api } from "@/lib/api";

interface DocState {
  docs: Doc[];
  isLoading: boolean;

  fetchDocs: () => Promise<void>;
  getDoc: (id: string) => Promise<Doc>;
  createDoc: (
    title: string,
    content: string,
    projectId?: string,
  ) => Promise<Doc>;
  updateDoc: (id: string, data: Partial<Doc>) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
  toggleDocStar: (id: string) => Promise<void>;
}

export const useDocStore = create<DocState>((set, get) => ({
  docs: [],
  isLoading: false,

  fetchDocs: async () => {
    set({ isLoading: true });
    try {
      const docs = await api.get<Doc[]>("/docs");
      set({ docs, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch docs:", error);
      set({ docs: [], isLoading: false });
    }
  },

  getDoc: async (id: string) => {
    try {
      const doc = await api.get<Doc>(`/docs/${id}`);
      set((state) => ({
        docs: state.docs.some((d) => d.id === id)
          ? state.docs.map((d) => (d.id === id ? doc : d))
          : [...state.docs, doc],
      }));
      return doc;
    } catch (error) {
      console.error("Failed to fetch doc:", error);
      throw error;
    }
  },

  createDoc: async (title: string, content: string, projectId?: string) => {
    const doc = await api.post<Doc>("/docs", { title, content, projectId });
    set((state) => ({
      docs: [...(Array.isArray(state.docs) ? state.docs : []), doc],
    }));
    return doc;
  },

  updateDoc: async (id: string, data: Partial<Doc>) => {
    const doc = await api.patch<Doc>(`/docs/${id}`, data);
    set((state) => ({
      docs: state.docs.map((d) => (d.id === id ? doc : d)),
    }));
  },

  deleteDoc: async (id: string) => {
    await api.delete(`/docs/${id}`);
    set((state) => ({
      docs: state.docs.filter((d) => d.id !== id),
    }));
  },

  toggleDocStar: async (id: string) => {
    const doc = get().docs.find((d) => d.id === id);
    if (doc) {
      await get().updateDoc(id, { starred: !doc.starred });
    }
  },
}));
