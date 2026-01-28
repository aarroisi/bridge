import { create } from 'zustand'
import { ActiveItem, Category, ViewMode } from '@/types'

interface UIState {
  activeCategory: Category
  activeItem: ActiveItem | null
  sidebarOpen: boolean
  viewMode: ViewMode
  selectedTaskId: string | null
  openThreadId: string | null
  collapsedSections: Record<string, boolean>

  setActiveCategory: (category: Category) => void
  setActiveItem: (item: ActiveItem | null) => void
  toggleSidebar: () => void
  setViewMode: (mode: ViewMode) => void
  setSelectedTask: (id: string | null) => void
  setOpenThread: (id: string | null) => void
  toggleSection: (section: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeCategory: 'home',
  activeItem: null,
  sidebarOpen: true,
  viewMode: 'board',
  selectedTaskId: null,
  openThreadId: null,
  collapsedSections: {},

  setActiveCategory: (category) => set({ activeCategory: category }),

  setActiveItem: (item) => set({ activeItem: item }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  setOpenThread: (id) => set({ openThreadId: id }),

  toggleSection: (section) =>
    set((state) => ({
      collapsedSections: {
        ...state.collapsedSections,
        [section]: !state.collapsedSections[section],
      },
    })),
}))
