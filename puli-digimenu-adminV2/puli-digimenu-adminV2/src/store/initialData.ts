import type { AppState, Banner, StorySection, Settings, FilterTag, MenuSection } from '@/types'

const defaultBanner: Banner = {
  id: undefined,
  title: '',
  subtitle: '',
  background_image: '',
  enabled: true,
}

const defaultStory: StorySection = {
  id: undefined,
  title: '',
  description: '',
  background_image: '',
}

const defaultSettings: Settings = {
  id: undefined,
  restaurant_name: '',
  restaurant_name_ar: '',
  address_en: '',
  address_ar: '',
  logo_url: '',
  logo_dark_url: '',
  logo_light_url: '',
  favicon_url: '',
  theme_mode: 'light',
}

const defaultSections: MenuSection[] = []

const defaultFilters: FilterTag[] = [
  { id: 'f-badge-chef', label_en: 'Chef Special', label_ar: 'مميز الشيف', type: 'badge', enabled: true, order: 0 },
  { id: 'f-badge-popular', label_en: 'Popular', label_ar: 'شائع', type: 'badge', enabled: true, order: 1 },
  { id: 'f-badge-recommended', label_en: 'Recommended', label_ar: 'موصى به', type: 'badge', enabled: true, order: 2 },
  { id: 'f-badge-vegetarian', label_en: 'Vegetarian', label_ar: 'نباتي', type: 'badge', enabled: true, order: 3 },
  { id: 'f-allergen-gluten', label_en: 'Gluten Free', label_ar: 'خالي من الغلوتين', type: 'allergen', enabled: true, order: 10 },
  { id: 'f-allergen-dairy', label_en: 'Dairy Free', label_ar: 'خالٍ من الألبان', type: 'allergen', enabled: true, order: 11 },
  { id: 'f-allergen-nuts', label_en: 'Nut Free', label_ar: 'خالٍ من المكسرات', type: 'allergen', enabled: true, order: 12 },
  { id: 'f-allergen-honey', label_en: 'Contains Honey', label_ar: 'يحتوي على عسل', type: 'allergen', enabled: true, order: 13 },
]

export const getInitialState = (): AppState => ({
  sections: defaultSections,
  categories: [],
  classifications: [],
  subcategories: [],
  countries: [],
  menuItems: [],
  banner: defaultBanner,
  story: defaultStory,
  filters: defaultFilters,
  media: [],
  settings: defaultSettings,
})
