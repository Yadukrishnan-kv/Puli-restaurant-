import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, MenuSection, Category, Classification, SubCategory, Country, MenuItem, Banner, StorySection, FilterTag, MediaItem, Settings } from '@/types'
import { getInitialState } from './initialData'

const STORAGE_KEY = 'puli-menu-admin'

type Store = AppState & {
  // Sections
  setSections: (sections: MenuSection[]) => void
  addSection: (section: MenuSection) => void
  updateSection: (id: string, data: Partial<MenuSection>) => void
  deleteSection: (id: string) => void
  reorderSections: (startIndex: number, endIndex: number) => void

  // Categories
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, data: Partial<Category>) => void
  deleteCategory: (id: string) => void
  reorderCategories: (startIndex: number, endIndex: number) => void

  // Classifications
  setClassifications: (classifications: Classification[]) => void
  addClassification: (classification: Classification) => void
  updateClassification: (id: string, data: Partial<Classification>) => void
  deleteClassification: (id: string) => void

  // SubCategories
  setSubCategories: (subcategories: SubCategory[]) => void
  addSubCategory: (subcategory: SubCategory) => void
  updateSubCategory: (id: string, data: Partial<SubCategory>) => void
  deleteSubCategory: (id: string) => void
  reorderSubCategories: (categoryId: string, startIndex: number, endIndex: number) => void

  // Countries
  setCountries: (countries: Country[]) => void
  addCountry: (country: Country) => void
  updateCountry: (id: string, data: Partial<Country>) => void
  deleteCountry: (id: string) => void

  // Menu items
  setMenuItems: (items: MenuItem[]) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, data: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  duplicateMenuItem: (id: string) => MenuItem | null
  reorderMenuItems: (categoryId: string, startIndex: number, endIndex: number) => void

  // Banner & Story
  setBanner: (banner: Banner) => void
  setStory: (story: StorySection) => void

  // Filters
  setFilters: (filters: FilterTag[]) => void
  updateFilter: (id: string, data: Partial<FilterTag>) => void

  // Media
  setMedia: (media: MediaItem[]) => void
  addMedia: (item: MediaItem) => void
  deleteMedia: (id: string) => void

  // Settings
  setSettings: (settings: Partial<Settings>) => void

  // Export for frontend
  exportData: () => string
  importData: (json: string) => boolean
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setSections: (sections) => set({ sections }),

      addSection: (section) =>
        set((s) => ({ sections: [...s.sections, section].sort((a, b) => a.order - b.order) })),

      updateSection: (id, data) =>
        set((s) => ({
          sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...data } : sec)),
        })),

      deleteSection: (id) =>
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== id),
          categories: s.categories.map((c) => (c.section_id === id ? { ...c, section_id: null } : c)),
        })),

      reorderSections: (startIndex, endIndex) =>
        set((s) => {
          const list = [...s.sections]
          const [removed] = list.splice(startIndex, 1)
          list.splice(endIndex, 0, removed)
          return { sections: list.map((sec, i) => ({ ...sec, order: i })) }
        }),

      setCategories: (categories) => set({ categories }),

setClassifications: (classifications: Classification[]) => set({ classifications }),

      addCategory: (category) =>
        set((s) => ({ categories: [...s.categories, category].sort((a, b) => a.order - b.order) })),

      updateCategory: (id, data) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          classifications: s.classifications.filter((cl) => cl.category_id !== id),
          menuItems: s.menuItems.filter((m) => m.category_id !== id),
        })),

      reorderCategories: (startIndex, endIndex) =>
        set((s) => {
          const list = [...s.categories]
          const [removed] = list.splice(startIndex, 1)
          list.splice(endIndex, 0, removed)
          return {
            categories: list.map((c, i) => ({ ...c, order: i })),
          }
        }),

      addClassification: (classification) =>
        set((s) => ({
          classifications: [...s.classifications, classification].sort(
            (a, b) => (a.category_id !== b.category_id ? 0 : a.order - b.order)
          ),
        })),

      updateClassification: (id, data) =>
        set((s) => ({
          classifications: s.classifications.map((cl) => (cl.id === id ? { ...cl, ...data } : cl)),
        })),

      deleteClassification: (id) =>
        set((s) => ({
          classifications: s.classifications.filter((cl) => cl.id !== id),
          menuItems: s.menuItems.map((m) => (m.classification_id === id ? { ...m, classification_id: null } : m)),
        })),

      // Subcategories
      setSubCategories: (subcategories) => set({ subcategories }),

      addSubCategory: (subcategory) =>
        set((s) => ({
          subcategories: [...s.subcategories, subcategory].sort((a, b) => a.order - b.order),
        })),

      updateSubCategory: (id, data) =>
        set((s) => ({
          subcategories: s.subcategories.map((sc) => (sc.id === id ? { ...sc, ...data } : sc)),
        })),

      deleteSubCategory: (id) =>
        set((s) => ({
          subcategories: s.subcategories.filter((sc) => sc.id !== id),
          menuItems: s.menuItems.map((m) => (m.subcategory_id === id ? { ...m, subcategory_id: null } : m)),
        })),

      reorderSubCategories: (categoryId, startIndex, endIndex) =>
        set((s) => {
          const inCat = s.subcategories
            .filter((sc) => sc.category_id === categoryId)
            .sort((a, b) => a.order - b.order)
          const rest = s.subcategories.filter((sc) => sc.category_id !== categoryId)
          const [moved] = inCat.splice(startIndex, 1)
          inCat.splice(endIndex, 0, moved)
          const reordered = inCat.map((sc, i) => ({ ...sc, order: i }))
          return { subcategories: [...rest, ...reordered] }
        }),

      // Countries
      setCountries: (countries) => set({ countries }),

      addCountry: (country) =>
        set((s) => ({
          countries: [...s.countries, country].sort((a, b) => a.order - b.order),
        })),

      updateCountry: (id, data) =>
        set((s) => ({
          countries: s.countries.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCountry: (id) =>
        set((s) => ({
          countries: s.countries.filter((c) => c.id !== id),
        })),

      setMenuItems: (menuItems) => set({ menuItems }),

      addMenuItem: (item) =>
        set((s) => ({
          menuItems: [...s.menuItems, item].sort((a, b) => {
            if (a.category_id !== b.category_id) return 0
            return a.order - b.order
          }),
        })),

      updateMenuItem: (id, data) =>
        set((s) => ({
          menuItems: s.menuItems.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),

      deleteMenuItem: (id) =>
        set((s) => ({ menuItems: s.menuItems.filter((m) => m.id !== id) })),

      duplicateMenuItem: (id) => {
        const item = get().menuItems.find((m) => m.id === id)
        if (!item) return null
        const newItem: MenuItem = {
          ...item,
          id: crypto.randomUUID(),
          name_en: `${item.name_en} (Copy)`,
          name_ar: `${item.name_ar} (نسخة)`,
        }
        get().addMenuItem(newItem)
        return newItem
      },

      reorderMenuItems: (categoryId, startIndex, endIndex) =>
        set((s) => {
          const inCategory = s.menuItems
            .filter((m) => m.category_id === categoryId)
            .sort((a, b) => a.order - b.order)
          const rest = s.menuItems.filter((m) => m.category_id !== categoryId)
          const [removed] = inCategory.splice(startIndex, 1)
          inCategory.splice(endIndex, 0, removed)
          const reordered = inCategory.map((m, i) => ({ ...m, order: i }))
          return {
            menuItems: [...rest, ...reordered],
          }
        }),

      setBanner: (banner) => set({ banner }),
      setStory: (story) => set({ story }),

      setFilters: (filters) => set({ filters }),
      updateFilter: (id, data) =>
        set((s) => ({
          filters: s.filters.map((f) => (f.id === id ? { ...f, ...data } : f)),
        })),

      setMedia: (media) => set({ media }),
      addMedia: (item) => set((s) => ({ media: [item, ...s.media] })),
      deleteMedia: (id) => set((s) => ({ media: s.media.filter((m) => m.id !== id) })),

      setSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),

      exportData: () => JSON.stringify(get(), null, 2),

      importData: (json) => {
        try {
          const data = JSON.parse(json) as Partial<AppState>
          set((s) => ({
            sections: data.sections ?? s.sections,
            categories: data.categories ?? s.categories,
            classifications: data.classifications ?? s.classifications,
            menuItems: data.menuItems ?? s.menuItems,
            banner: data.banner ?? s.banner,
            story: data.story ?? s.story,
            filters: data.filters ?? s.filters,
            media: data.media ?? s.media,
            settings: data.settings ?? s.settings,
          }))
          return true
        } catch {
          return false
        }
      },
    }),
    { name: STORAGE_KEY }
  )
)
