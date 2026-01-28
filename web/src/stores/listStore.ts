import { create } from "zustand";
import { List, Task, Subtask } from "@/types";
import { api } from "@/lib/api";

interface ListState {
  lists: List[];
  tasks: Record<string, Task[]>;
  subtasks: Record<string, Subtask[]>;
  isLoading: boolean;

  // List operations
  fetchLists: () => Promise<void>;
  createList: (name: string, projectId?: string) => Promise<List>;
  updateList: (id: string, data: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  toggleListStar: (id: string) => Promise<void>;

  // Task operations
  fetchTasks: (listId: string) => Promise<void>;
  createTask: (listId: string, data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Subtask operations
  fetchSubtasks: (taskId: string) => Promise<void>;
  createSubtask: (taskId: string, data: Partial<Subtask>) => Promise<Subtask>;
  updateSubtask: (id: string, data: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  tasks: {},
  subtasks: {},
  isLoading: false,

  // List operations
  fetchLists: async () => {
    set({ isLoading: true });
    try {
      const lists = await api.get<List[]>("/lists");
      set({ lists, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch lists:", error);
      set({ lists: [], isLoading: false });
    }
  },

  createList: async (name: string, projectId?: string) => {
    const list = await api.post<List>("/lists", { name, projectId });
    set((state) => ({
      lists: [...(Array.isArray(state.lists) ? state.lists : []), list],
    }));
    return list;
  },

  updateList: async (id: string, data: Partial<List>) => {
    const list = await api.patch<List>(`/lists/${id}`, data);
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? list : l)),
    }));
  },

  deleteList: async (id: string) => {
    await api.delete(`/lists/${id}`);
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
      tasks: { ...state.tasks, [id]: [] },
    }));
  },

  toggleListStar: async (id: string) => {
    const list = get().lists.find((l) => l.id === id);
    if (list) {
      await get().updateList(id, { starred: !list.starred });
    }
  },

  // Task operations
  fetchTasks: async (listId: string) => {
    try {
      const tasks = await api.get<Task[]>(`/lists/${listId}/tasks`);
      set((state) => ({
        tasks: { ...state.tasks, [listId]: tasks },
      }));
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  },

  createTask: async (listId: string, data: Partial<Task>) => {
    const task = await api.post<Task>(`/lists/${listId}/tasks`, data);
    set((state) => ({
      tasks: {
        ...state.tasks,
        [listId]: [...(state.tasks[listId] || []), task],
      },
    }));
    return task;
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const task = await api.patch<Task>(`/tasks/${id}`, data);
    set((state) => {
      const listId = task.listId;
      return {
        tasks: {
          ...state.tasks,
          [listId]: (state.tasks[listId] || []).map((t) =>
            t.id === id ? task : t,
          ),
        },
      };
    });
  },

  deleteTask: async (id: string) => {
    await api.delete(`/tasks/${id}`);
    set((state) => {
      const newTasks = { ...state.tasks };
      Object.keys(newTasks).forEach((listId) => {
        newTasks[listId] = newTasks[listId].filter((t) => t.id !== id);
      });
      return { tasks: newTasks };
    });
  },

  // Subtask operations
  fetchSubtasks: async (taskId: string) => {
    try {
      const subtasks = await api.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
      set((state) => ({
        subtasks: { ...state.subtasks, [taskId]: subtasks },
      }));
    } catch (error) {
      console.error("Failed to fetch subtasks:", error);
    }
  },

  createSubtask: async (taskId: string, data: Partial<Subtask>) => {
    const subtask = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, data);
    set((state) => ({
      subtasks: {
        ...state.subtasks,
        [taskId]: [...(state.subtasks[taskId] || []), subtask],
      },
    }));
    return subtask;
  },

  updateSubtask: async (id: string, data: Partial<Subtask>) => {
    const subtask = await api.patch<Subtask>(`/subtasks/${id}`, data);
    set((state) => {
      const taskId = subtask.taskId;
      return {
        subtasks: {
          ...state.subtasks,
          [taskId]: (state.subtasks[taskId] || []).map((s) =>
            s.id === id ? subtask : s,
          ),
        },
      };
    });
  },

  deleteSubtask: async (id: string) => {
    await api.delete(`/subtasks/${id}`);
    set((state) => {
      const newSubtasks = { ...state.subtasks };
      Object.keys(newSubtasks).forEach((taskId) => {
        newSubtasks[taskId] = newSubtasks[taskId].filter((s) => s.id !== id);
      });
      return { subtasks: newSubtasks };
    });
  },
}));
