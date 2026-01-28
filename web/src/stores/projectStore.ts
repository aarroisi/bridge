import { create } from "zustand";
import { Project } from "@/types";
import { api } from "@/lib/api";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await api.get<Project[]>("/projects");
      set({ projects, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      set({ projects: [], isLoading: false });
    }
  },

  createProject: async (name: string) => {
    const project = await api.post<Project>("/projects", { name });
    set((state) => ({
      projects: [
        ...(Array.isArray(state.projects) ? state.projects : []),
        project,
      ],
    }));
    return project;
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    const project = await api.patch<Project>(`/projects/${id}`, data);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
  },

  deleteProject: async (id: string) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },

  toggleStar: async (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    if (project) {
      await get().updateProject(id, { starred: !project.starred });
    }
  },
}));
