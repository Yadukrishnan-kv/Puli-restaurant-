/**
 * Customer Frontend API Client
 * 
 * Fetches public menu data from the backend
 * No authentication required for customer endpoints
 */

import axios, { AxiosInstance } from 'axios'

const ABSOLUTE_URL_REGEX = /^https?:\/\//i

export interface MenuData {
  _id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  items: MenuItemData[]
}

export interface CategoryData {
  _id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  image_url?: string
  items?: MenuItemData[]
  category_id?: string
}

export interface MenuItemData {
  _id: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: number
  image_url?: string
  calories?: number
  allergens?: string[]
  tags?: string[]
  country_code?: string
  country_name_en?: string
  country_name_ar?: string
  spice_level?: number
  visible: boolean
  order: number
  category_id?: string
  subcategory_id?: string
  classification_id?: string
  country_id?: string
  section_id?: string
  dietary_tags?: string[]
  available_from?: string
  available_to?: string
  available_days?: string[]
}

export interface FilterTagData {
  _id: string
  name_en: string
  name_ar: string
  badge_type: 'badge' | 'allergen'
  type?: 'dietary' | 'allergen'
  order: number
}

export interface BannerData {
  id: string
  title: string
  subtitle: string
  background_image?: string
  enabled?: boolean
}

export interface StoryData {
  id: string
  title: string
  title_ar?: string
  description: string
  description_ar?: string
  background_image?: string
}

export interface SettingsData {
  id: string
  restaurant_name: string
  restaurant_name_ar?: string
  address_en?: string
  address_ar?: string
  logo_url?: string
  logo_dark_url?: string
  logo_light_url?: string
  favicon_url?: string
  theme_mode?: string
}

export interface CustomerRecord {
  id: string
  fullName: string
  contactNumber: string
  email: string
  dateOfBirth?: string
  anniversaryDate?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerFormData {
  fullName: string
  contactNumber: string
  email: string
  dateOfBirth?: string
  anniversaryDate?: string
}

export interface CustomerListResponse {
  data: CustomerRecord[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface MenuLayoutData {
  id: string
  name_en: string
  name_ar?: string
  order: number
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string)?.trim();

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is not defined in the environment!');
}


function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (typeof obj.error === 'string' && obj.error.trim()) {
      throw new Error(obj.error)
    }
    const candidateKeys = ['data', 'items', 'results', 'rows', 'list', 'categories', 'menu']

    for (const key of candidateKeys) {
      const value = obj[key]
      if (Array.isArray(value)) return value as T[]
    }
  }

  return []
}

function extractObject<T>(payload: unknown): T {
  if (payload === null || payload === undefined) {
    return {} as T
  }

  if (typeof payload !== 'object') {
    return {} as T
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const wrapped = (payload as Record<string, unknown>).data
    if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
      return wrapped as T
    }
  }

  return payload as T
}

function toAbsoluteAssetUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (ABSOLUTE_URL_REGEX.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/assets/')) return url

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function normalizeCategory(category: CategoryData): CategoryData {
  return {
    ...category,
    image_url: toAbsoluteAssetUrl(category.image_url),
  }
}

function normalizeItem(item: MenuItemData): MenuItemData {
  return {
    ...item,
    image_url: toAbsoluteAssetUrl(item.image_url),
  }
}

class CustomerAPIClient {
  private client: AxiosInstance

  constructor(baseURL = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get complete menu hierarchy
   * Returns sections with categories and items
   */
  async getMenu(): Promise<MenuData[]> {
    const response = await this.client.get<unknown>('/api/public/menu')
    const sections = extractArray<MenuData>(response.data)

    return sections.map((section) => ({
      ...section,
      items: (section.items ?? []).map(normalizeItem),
    }))
  }

  /**
   * Get all menu items in flat list
   * Useful for filtering and searching
   */
  async getAllMenuItems(): Promise<MenuItemData[]> {
    const response = await this.client.get<unknown>('/api/public/menu-items')
    return extractArray<MenuItemData>(response.data).map(normalizeItem)
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryData[]> {
    const response = await this.client.get<unknown>('/api/public/categories')
    return extractArray<CategoryData>(response.data).map(normalizeCategory)
  }

  /**
   * Get available filter tags
   */
  async getFilterTags(): Promise<FilterTagData[]> {
    const response = await this.client.get<unknown>('/api/public/filter-tags')
    return extractArray<FilterTagData>(response.data)
  }

  /**
   * Get site banner(s)
   */
  async getBanners(): Promise<{ id: string; title: string; subtitle: string; background_image?: string; enabled?: boolean }[]> {
    const response = await this.client.get<unknown>('/api/banners')
    return extractArray<{ id: string; title: string; subtitle: string; background_image?: string; enabled?: boolean }>(response.data).map((banner) => ({
      ...banner,
      background_image: toAbsoluteAssetUrl(banner.background_image),
    }))
  }

  /**
   * Get story section content
   */
  async getStory(): Promise<{ id: string; title: string; title_ar?: string; description: string; description_ar?: string; background_image?: string }> {
    const response = await this.client.get<unknown>('/api/stories')
    const story = extractObject<{ id: string; title: string; title_ar?: string; description: string; description_ar?: string; background_image?: string }>(response.data)

    return {
      ...story,
      background_image: toAbsoluteAssetUrl(story.background_image),
    }
  }

  /**
   * Get app settings (logo / menu title / theme)
   */
  async getSettings(): Promise<{ id: string; restaurant_name: string; restaurant_name_ar?: string; address_en?: string; address_ar?: string; logo_url?: string; logo_dark_url?: string; logo_light_url?: string; favicon_url?: string; theme_mode?: string }> {
    const response = await this.client.get<unknown>('/api/settings')
    const settings = extractObject<{ id: string; restaurant_name: string; restaurant_name_ar?: string; address_en?: string; address_ar?: string; logo_url?: string; logo_dark_url?: string; logo_light_url?: string; favicon_url?: string; theme_mode?: string }>(response.data)

    return {
      ...settings,
      logo_url: toAbsoluteAssetUrl(settings.logo_url),
      logo_dark_url: toAbsoluteAssetUrl(settings.logo_dark_url),
      logo_light_url: toAbsoluteAssetUrl(settings.logo_light_url),
      favicon_url: toAbsoluteAssetUrl(settings.favicon_url),
    }
  }

  /**
   * Get menu layout / sections order
   */
  async getMenuLayout(): Promise<{ id: string; name_en: string; name_ar?: string; order: number }[]> {
    const response = await this.client.get<unknown>('/api/menu-layout')
    return extractArray<{ id: string; name_en: string; name_ar?: string; order: number }>(response.data)
  }

  async createCustomer(customer: CustomerFormData): Promise<CustomerRecord> {
    const response = await this.client.post<CustomerRecord>('/api/customers', customer)
    return response.data
  }

  /**
   * Get single category with its items
   */
  async getCategory(categoryId: string): Promise<CategoryData> {
    const response = await this.client.get<CategoryData>(`/api/public/categories/${categoryId}`)
    return normalizeCategory(response.data)
  }

  /**
   * Search items by name
   */
  searchItems(items: MenuItemData[], query: string): MenuItemData[] {
    const lowerQuery = query.toLowerCase()
    return items.filter(
      (item) =>
        item.name_en.toLowerCase().includes(lowerQuery) ||
        item.name_ar.includes(query) ||
        item.description_en.toLowerCase().includes(lowerQuery) ||
        item.description_ar.includes(query)
    )
  }

  /**
   * Filter items by allergens (hide items with selected allergens)
   */
  filterByAllergens(items: MenuItemData[], allergenFilter: string[]): MenuItemData[] {
    if (allergenFilter.length === 0) return items

    return items.filter((item) => {
      if (!item.allergens) return true
      return !item.allergens.some((allergen) => allergenFilter.includes(allergen))
    })
  }

  /**
   * Filter items by tags
   */
  filterByTags(items: MenuItemData[], tags: string[]): MenuItemData[] {
    if (tags.length === 0) return items

    return items.filter((item) => {
      if (!item.tags) return false
      return tags.some((tag) => item.tags?.includes(tag))
    })
  }

  /**
   * Filter items by spice level
   */
  filterBySpiceLevel(items: MenuItemData[], maxLevel: number): MenuItemData[] {
    return items.filter((item) => {
      const spice = item.spice_level || 0
      return spice <= maxLevel
    })
  }

  /**
   * Filter items by country code
   */
  filterByCountry(items: MenuItemData[], countryCodes: string[]): MenuItemData[] {
    if (countryCodes.length === 0) return items

    return items.filter((item) => item.country_code && countryCodes.includes(item.country_code))
  }

  /**
   * Get items marked as popular
   */
  getPopularItems(items: MenuItemData[]): MenuItemData[] {
    return items.filter((item) => item.tags?.includes('popular')).slice(0, 12)
  }

  /**
   * Get chef's special items
   */
  getChefSpecials(items: MenuItemData[]): MenuItemData[] {
    return items.filter((item) => item.tags?.includes('chef_special'))
  }

  /**
   * Get vegetarian items
   */
  getVegetarianItems(items: MenuItemData[]): MenuItemData[] {
    return items.filter((item) => item.tags?.includes('vegetarian'))
  }

  /**
   * Sort items by various criteria
   */
  sortItems(
    items: MenuItemData[],
    sortBy: 'name' | 'price-asc' | 'price-desc' | 'popularity' | 'order'
  ): MenuItemData[] {
    const sorted = [...items]

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name_en.localeCompare(b.name_en))
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price)
      case 'popularity':
        return sorted.sort((a, b) => {
          const aPopular = a.tags?.includes('popular') ? 1 : 0
          const bPopular = b.tags?.includes('popular') ? 1 : 0
          return bPopular - aPopular
        })
      case 'order':
      default:
        return sorted.sort((a, b) => a.order - b.order)
    }
  }
}

export const customerAPI = new CustomerAPIClient()
export default CustomerAPIClient
