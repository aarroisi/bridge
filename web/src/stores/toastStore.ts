import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  autoClose: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, autoClose?: boolean) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, autoClose = true) => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, type, message, autoClose };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove success toasts after 5 seconds
    if (autoClose && type === "success") {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 5000);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (message) => {
    const state = useToastStore.getState();
    state.addToast("success", message, true);
  },

  error: (message) => {
    const state = useToastStore.getState();
    state.addToast("error", message, false);
  },
}));
