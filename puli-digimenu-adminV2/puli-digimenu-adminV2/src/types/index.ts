// Core data models for the restaurant menu CMS

/** Section heading on the menu page (e.g. MAIN MENU, SPECIAL MENU). Categories sit under these. */
export interface MenuSection {
  id: string
  name_en: string
  name_ar: string
  order: number
  visible: boolean
}

export interface Category {
  id: string
  section_id: string | null
  name_en: string
  name_ar: string
  description: string
  image: string
  order: number
  visible: boolean
  slug: string
}

/** Sub-category under a category (e.g. Soup, Desserts, Main, Juice). Every menu item must belong to one. */
export interface Classification {
  id: string
  category_id: string
  name_en: string
  name_ar: string
  order: number
  visible: boolean
}

export interface MenuItem {
  id: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: number
  category_id: string
  subcategory_id: string | null
  classification_id: string | null
  country_id: string | null
  image: string
  tags: string[]
  calories: string | number | null
  allergens: string[]
  visible: boolean
  order: number
  chef_special: boolean
  popular: boolean
  recommended: boolean
  available_from: string | null // "12:00"
  available_to: string | null   // "16:00"
  available_days: number[]      // 0=Sun, 1=Mon, ... 6=Sat
}

export interface Banner {
  id?: string
  title: string
  subtitle: string
  background_image: string
  enabled: boolean
}

export interface StorySection {
  id?: string
  title: string
  description: string
  background_image: string
}

export interface FilterTag {
  id: string
  label_en: string
  label_ar: string
  type: 'badge' | 'allergen'  // badge = Chef Special, Popular, etc.; allergen = Dairy, Nuts
  enabled: boolean
  order: number
}

export interface MediaItem {
  id: string
  url: string
  name: string
  uploaded_at: string
  size: number
}

export interface Settings {
  id?: string
  restaurant_name: string
  restaurant_name_ar?: string
  address_en?: string
  address_ar?: string
  logo_url: string
  logo_dark_url?: string
  logo_light_url?: string
  favicon_url: string
  theme_mode: 'light' | 'dark' | 'system'
}

export interface Customer {
  id: string
  fullName: string
  contactNumber: string
  email: string
  dateOfBirth?: string
  anniversaryDate?: string
  createdAt: string
  updatedAt: string
}

export type Language = 'en' | 'ar'

export interface SubCategory {
  id: string
  category_id: string
  name_en: string
  name_ar: string
  order: number
  visible: boolean
}

export interface Country {
  id: string
  name_en: string
  name_ar: string
  flag_image?: string
  order: number
  visible: boolean
}

export interface AppState {
  sections: MenuSection[]
  categories: Category[]
  classifications: Classification[]
  subcategories: SubCategory[]
  countries: Country[]
  menuItems: MenuItem[]
  banner: Banner
  story: StorySection
  filters: FilterTag[]
  media: MediaItem[]
  settings: Settings
}
