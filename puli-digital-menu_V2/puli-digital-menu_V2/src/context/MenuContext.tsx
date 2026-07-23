import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  customerAPI,
  type CategoryData,
  type MenuItemData,
  type FilterTagData,
  type BannerData,
  type StoryData,
  type SettingsData,
  type MenuLayoutData,
} from '@/lib/customerAPI'

interface MenuContextType {
  categories: CategoryData[]
  menuItems: MenuItemData[]
  filterTags: FilterTagData[]
  banner: BannerData | null
  story: StoryData | null
  settings: SettingsData | null
  menuLayout: MenuLayoutData[]
  loading: boolean
  error: string | null
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([])
  const [filterTags, setFilterTags] = useState<FilterTagData[]>([])
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [story, setStory] = useState<StoryData | null>(null)
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [menuLayout, setMenuLayout] = useState<MenuLayoutData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          categoriesData,
          itemsData,
          tagsData,
          bannersData,
          storyData,
          settingsData,
          layoutData,
        ] = await Promise.all([
          customerAPI.getCategories(),
          customerAPI.getAllMenuItems(),
          customerAPI.getFilterTags(),
          customerAPI.getBanners(),
          customerAPI.getStory(),
          customerAPI.getSettings(),
          customerAPI.getMenuLayout(),
        ])

        setCategories(categoriesData)
        setMenuItems(itemsData)
        setFilterTags(tagsData)
        setBanner(bannersData[0] ?? null)
        setStory(storyData)
        setSettings(settingsData)
        setMenuLayout(layoutData)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load menu data'
        setError(message)
        console.error('Error loading menu:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMenuData()
  }, [])

  return (
    <MenuContext.Provider
      value={{
        categories,
        menuItems,
        filterTags,
        banner,
        story,
        settings,
        menuLayout,
        loading,
        error,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export const useMenuContext = () => {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenuContext must be used within MenuProvider')
  }
  return context
}
